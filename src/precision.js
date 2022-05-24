const { values, keys, sortBy, isArray } = require("lodash")
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

const dir = (isArray(config.input)) ? config.input : [config.input]
const file = config.parameters.defaultfilename
const outputFile = (isArray(config.output)) ? config.output : [config.output]
const range = config.parameters.frequency.range || [0, 2000]


console.log(`
SPECTRUM CLASS PRECISION ANALISIS
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
		header:inputData.header,
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



const run = async () => {

	for( let fileIndex = 0; fileIndex < dir.length; fileIndex++ ){
		console.log(`${dir[fileIndex]}${file}`)
		const res = await processData(path.resolve(`${dir[fileIndex]}${file}`))

		let header = (["Model","File"]).concat(res.header[0])
		
		let normalized = [header]
		normalized = normalized.concat(res.n_spectrum.map((d,i) => ([res.modelMetadata[i][0],res.modelMetadata[i][1]]).concat(d)))
		normalized.push((["CENTROID OF SPECTRUM SET","calculable"]).concat(res.centroid))
		
		let distances = [["Model","File","Distance from Centroid"]]
		distances = distances.concat(res.distances.map((d,i)=> ([res.modelMetadata[i][0],res.modelMetadata[i][1]]).concat(d)))
		distances.push(["avg (radius of spectrum set)", "calculable", res.mean])
		distances.push(["std", "calculable", res.std])
		distances.push(["p=0.95 confidence int (lo)", "calculable",(res.confidence_interval_rs[0] < 0) ? 0 : res.confidence_interval_rs[0]])
		distances.push(["p=0.95 confidence int (hi)", "calculable", res.confidence_interval_rs[1]])
		
		// console.log(normalized)
		
		let resWb = newWb()
		addWs(resWb, aoa2ws(normalized), "normalized spectrum")	
		addWs(resWb, aoa2ws(distances), "distances")	
		
		await makeDir(path.dirname(outputFile[fileIndex]))
		writeXlsxWb(resWb, path.resolve(outputFile[fileIndex]))
	}	

	
}

run()
