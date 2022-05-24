const { values, keys, sortBy } = require("lodash")
const path = require("path")


const {
	loadXlsx,
	loadXlsxWb,
	wb2json,
	aoa2ws,
	writeXlsxWb,
	addWs,
	newWb,
	prepareInputData
} = require("./utils/xlsx")	

const {
	sum,
	normEuclide,
	normalize,
	scalarProd, 
	centroid
} = require("./utils/vector")

const {
	avg, 
	stdev
} = require("./utils/stat")

const {
	getDirList,
	makeDir,
	loadConfig
} = require("./utils/file-system")



const config = loadConfig(process.argv[2] || "./config/example.yaml")

const dir = config.input
const file = config.parameters.defaultfilename
const outputFile = config.output
const range = config.parameters.frequency.range || [0, 2000]


console.log(`
SPECTRUM ALL CLASSES SEPARABILITY ANALISIS
`)

console.log(JSON.stringify(config, null, " "))

const dist = (a,b) => {
	const s = scalarProd(a, b)
	const r = 1-s 
	return (Number.isNaN(r) ? 0 : r)
}

const processData = async filename => {
	
	let wb = await loadXlsxWb(filename)
	const inputData = prepareInputData(wb, range)
	let n_spectrum = inputData.spectrum.map( d => normalize(d, normEuclide))
	const c = normalize(centroid(n_spectrum), normEuclide)
	let distances = n_spectrum.map( d => {
		const s = scalarProd(c, d)
		const r = 1-s 
		return (Number.isNaN(r) ? 0 : r)
	})

	let mean = avg(distances)
	let std = stdev(distances)

	let reduced = distances.filter(d => d <= mean + 3*std)
	
	mean = avg(reduced)
	std = stdev(reduced)

	return {
		n_spectrum,
		modelMetadata: inputData.modelMetadata,
		centroid: c,
		distances,
		mean,
		std,
		p: 0.95,
		rs: mean,
		delta_rs: 1.96 * std,
		confidence_interval_rs: [mean-1.96*std, mean+1.96*std]
	}

}


const get_separability = async (f1, f2) => {
	let summary = []
	let spectrum1 = await processData(f1)
	let spectrum2 = await processData(f2)
	let cc = 1- scalarProd(spectrum1.centroid, spectrum2.centroid)

	return {
		spectrum1,
		spectrum2,
		centroid_distance: cc,
		separability: cc > (spectrum1.confidence_interval_rs[1] + spectrum2.confidence_interval_rs[1])
	}
}

const getIntersectMeasures = res => {

	let m = 0
	if(res.centroid_distance < (res.spectrum1.confidence_interval_rs[1] + res.spectrum2.confidence_interval_rs[1])){
		m = res.spectrum1.confidence_interval_rs[1]+res.spectrum2.confidence_interval_rs[1] - res.centroid_distance
	}

	if(res.spectrum1.confidence_interval_rs[1] >= res.spectrum2.confidence_interval_rs[1]+res.centroid_distance){
		m = 2*res.spectrum2.confidence_interval_rs[1]
	}

	if(res.spectrum2.confidence_interval_rs[1] >= res.spectrum1.confidence_interval_rs[1]+res.centroid_distance){
		m = 2*res.spectrum1.confidence_interval_rs[1]
	}
	
	return [m/res.spectrum1.confidence_interval_rs[1]/2, m/res.spectrum2.confidence_interval_rs[1]/2]

} 


const run = async () => {

	const spectrumSets = sortBy(await getDirList(dir))
	console.log("Found Spectrum Sets:", spectrumSets)

	let separability = [["","Radius of Set", "Delta", "Confidence Interval (low)","Confidence Interval (hi)"].concat(spectrumSets)]
	let distances = [["","Confidence Interval (hi)"].concat(spectrumSets)]
	let measure = [[""].concat(spectrumSets)]
	
	for(let i=0; i<spectrumSets.length; i++){
		
		let row = [spectrumSets[i]]
		let drow = [spectrumSets[i]]
		let drowHead = ["",""]
		let mrow = [spectrumSets[i]]

		for(let j=0; j<spectrumSets.length; j++){
			
			let res = await get_separability(`${dir}${spectrumSets[i]}/${file}`, `${dir}${spectrumSets[j]}/${file}`)
			
			let intersect = getIntersectMeasures(res)
			mrow.push(
				intersect.map( d => `${(d*100).toFixed(1)}%`).join(" vs ")
			)

			if(i==0){
				drowHead.push(res.spectrum2.confidence_interval_rs[1])
			}

			if(j==0){
				row = row.concat([
					res.spectrum1.rs, 
					res.spectrum1.delta_rs, 
					(res.spectrum1.confidence_interval_rs[0] > 0) ? res.spectrum1.confidence_interval_rs[0] : 0, 
					res.spectrum1.confidence_interval_rs[1]
				])

				drow = drow.concat([res.spectrum1.confidence_interval_rs[1]])
			}
			let value = ""
			
			if( res.centroid_distance > (res.spectrum1.confidence_interval_rs[1] + res.spectrum2.confidence_interval_rs[1]) ){
				value = "separate"
			} else {
				value = "not separate"
			}

			if(value == "not separate"){
				if(res.spectrum1.confidence_interval_rs[1] > res.centroid_distance+res.spectrum2.confidence_interval_rs[1]){
					value = "superset"
				}
				if(res.spectrum2.confidence_interval_rs[1] > res.centroid_distance+res.spectrum1.confidence_interval_rs[1]){
					value = "subset"
				}
			}

			
			row.push( value )
			drow.push(res.centroid_distance)
			
			console.log(`Class "${spectrumSets[i]}" vs Class "${spectrumSets[j]}"`)
		}

		separability.push(row)
		if(i==0){
			distances.push(drowHead)		
		}
		distances.push(drow)
		measure.push(mrow)
	}

	let resWb = newWb()
	addWs(resWb, aoa2ws(separability), "classes separability")	
	addWs(resWb, aoa2ws(distances), "centroid distances")	
	addWs(resWb, aoa2ws(measure), "intersections")	
	
	await makeDir(path.dirname(outputFile))
	writeXlsxWb(resWb, path.resolve(outputFile))	
}

run()
