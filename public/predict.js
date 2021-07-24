$("#image-selector").change(function () {
	let reader = new FileReader();
	reader.onload = function () {
		let dataURL = reader.result;
		$("#selected-image").attr("src", dataURL);
	}
	
	let file = $("#image-selector").prop('files')[0];
	reader.readAsDataURL(file);
});

let model;
$( document ).ready(async function () {
    console.log( "Loading model..." );
    model = await tf.loadLayersModel('/model/model.json');
    console.log( "Model loaded." );
});

$("#predict-button").click(async function () {
	let image = $('#selected-image').get(0);
	//console.log(image)
		// Pre-process the image
	let tensor = tf.browser.fromPixels(image)
		.resizeNearestNeighbor([224,224]) // change the image size here
		.toFloat()
		.div(tf.scalar(255.0))
		.expandDims();

	let predictions = await model.predict(tensor).data();
	//console.log(predictions)
	let top5 = Array.from(predictions)
		.map(function (p, i) { // this is Array.map
			return {
				probability: p,
				className: TARGET_CLASSES[i] // we are selecting the value from the obj
			};
		}).sort(function (a, b) {
			return b.probability - a.probability;
		})

	$("#prediction").empty();
	
	
	$("#food").attr("value", "Vegetarian")
	let btn=document.querySelector("#buttonAdd")
	//console.log(top5[0].probability)
	//console.log(typeof(top5[0].probability))
	console.log(top5)
	if(top5[0].probability > 0.52)
	{
		$("#prediction").append(`${top5[0].className}`);
		$("#foodname").attr("value", `${top5[0].className}`)
	}
	else{
		$("#prediction").append(`NOT A FOOD!`);
		
	}
	
});