const { reduce } = require("lodash")
const STAT = require("./stat")



let sum = data => reduce(data, (d,s) => d+s, 0)

let normEuclide = vector => {
	vector = vector.map( d => d*d)
	return Math.sqrt(sum(vector))
}

let normalize = (vector, normFunc) => {
	const norm = normFunc(vector)
	return vector.map( d => d/norm)
}

let scalarProd = (v1,v2) => {
	const length = Math.min(v1.length, v2.length)
	let tmp = []
	for(let i=0; i < length; i++) tmp.push(v1[i]*v2[i])
	return sum(tmp) 
}

let centroid = vectorSet => {
	let res = []
	for (let i=0; i < vectorSet[0].length; i++){
		res.push(STAT.mean(vectorSet.map(d => d[i])))
	}
	return res
}


module.exports = {
	sum,
	normEuclide,
	normalize,
	scalarProd, 
	centroid
}

