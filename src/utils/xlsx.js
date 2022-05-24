const xlsx = require("xlsx")
const path = require("path")
const { keys } = require("lodash")

let newWb = () => xlsx.utils.book_new()

let loadXlsxWb = async (filename) => {
	let d = await xlsx.readFile(path.resolve(filename))
	return d
}

let wb2json = wb => {
	for(i in wb.Sheets){
		wb.Sheets[i] = xlsx.utils.sheet_to_json(wb.Sheets[i]);	
	}
	return wb.Sheets	
}

let loadXlsx = async (filename) => {
	let wb = await loadXlsxWb(path.resolve(filename))
	return wb2json(wb)
}

let aoa2ws = aoa => xlsx.utils.aoa_to_sheet(aoa)

let addWs = (wb, ws, ws_name) => {
	xlsx.utils.book_append_sheet(wb, ws, ws_name)
}

let writeXlsxWb = (wb, filename) => {
	xlsx.writeFile(wb, path.resolve(filename))
}	


let prepareInputData = (wb, range) => {
	let res = wb2json(wb)
	let header = keys(res.Sheet1[0]).filter( d => d != "Model" && d != "File name").splice(range[0],range[1]-range[0]+1)
	let left_cols = []
	
	res = res.Sheet1.map( d => {
		let tmp = []
		for (let i=range[0]; i<=range[1]; i++) tmp.push(d[i+''])
		left_cols.push([d.Model, d['File name']])
		return tmp
	})
	
	// console.log(range)
	return {
		spectrum: res,
		modelMetadata: left_cols,
		header: [header]
	}
}



module.exports = {
	loadXlsx,
	loadXlsxWb,
	wb2json,
	aoa2ws,
	writeXlsxWb,
	addWs,
	newWb,
	prepareInputData
}