hmi = {};

/* 

   Configure me here!
   List the output name, and the corresponding pin, for each output.
   
 */
hmi.pins = {"mouth":12,"head":16,"breathing":18,"tail":22};
hmi.patternLength = 60;


/* Auto generate an index */
for(var p in hmi.pins){
	if(hmi.pins.hasOwnProperty(p)){
		if(hmi.outputs == undefined){
			hmi.outputs = [p];
		}else{
			hmi.outputs.push(p);
		}
	}
}
