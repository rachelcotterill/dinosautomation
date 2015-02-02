function magic(data,pins) {

	var nodeRedUrl = "http://192.168.26.133:1880/flows/";

	// input node (mouse click)
	var leftClick = {"id":"rec:input:leftMouse","type":"rpi-mouse","name":"Mouse Click Left","butt":"1","x":1,"y":1,"z":"3acb940b.4292bc","wires":[[]]};


	// node templates
	triggerTemplate = {"id":"","type":"trigger","op1":"1","op2":"0","op1type":"val","op2type":"val","duration":"2","extend":"false","units":"s","name":"","x":1,"y":1,"z":"3acb940b.4292bc","wires":[[]]};
	delayTemplate = {"id":"","type":"delay","name":"","pauseType":"delay","timeout":"5","timeoutUnits":"seconds","rate":"1","rateUnits":"second","randomFirst":"1","randomLast":"5","randomUnits":"seconds","drop":false,"x":1,"y":1,"z":"3acb940b.4292bc","wires":[[]]};
	gpioOutputTemplate = {"id":"","type":"rpi-gpio out","name":"Pin 12","pin":"12","set":true,"level":"0","out":"out","x":1,"y":1,"z":"3acb940b.4292bc","wires":[[]]};
	


	// static timeline test data	
/*	var red = [1,1,1,1,0,0,0,0,1,1,1,1];
	var amber = [0,0,1,1,0,0,1,1,0,0,1,1];
	var green = [0,0,0,0,1,1,0,0,0,0,0,0];
	var times = [red,amber,green];
*/



	var offset = 50;
	var multiplier = 50;

	var idCounter = 0;


	var endNodes = [];
	var nodeList = [];
	prevNode = -1;



	parseTimeline();



	function parseTimeline(){



		// add start node
		createNode("start",0,0,0);


		var times = [];
		for(var v in pins){
			if(pins.hasOwnProperty(v)){
						
				// get the data	arrays
				var A = data[v];

				// add to array of timelines
				if(times == undefined){
					times = [A];
				}else{
					times.push(A);
				}
				
				// add end node
				end = JSON.parse(JSON.stringify(gpioOutputTemplate));
				end.x = ((idCounter+8)*multiplier)+offset;
				end.y = ((idCounter+1)*multiplier)+(2*offset);
				end.pin = pins[v];
				end.name = v;
				end.id = "rec:output:"+idCounter;
				idCounter++;
				if(endNodes == undefined){
					endNodes = [end];
				}else{
					endNodes.push(end);
				}
			}
		}
		
		rowCount = times.length;
		colCount = times[0].length;


		for (j=0; j<times.length; j++){

			timeline = times[j];
			prevState = 0;
			t = 0;
			bool = true;
		
			for (i=0; i<timeline.length; i++){
		
				state = timeline[i];

				if(state==1){
					if(prevState==0){
						//change of state
						//create a delay node
						createNode("delay",t,i,j,bool);
						bool = false;
						t = 1;
					}else{
						t++;
					}
				}else{
					if(prevState==1){
						//change of state
						//create a trigger node
						createNode("trigger",t,i,j,bool);
						bool = false;
						t++;
					}else{
						t++;
					}
				}
						
				prevState = state;
			
			}
	
			// save final state
			if(state==1){
				createNode("trigger",t,colCount+1,j,bool);
				bool = false;
			}else if(state==0){
				createNode("delay",t,colCount+1,j,bool);
				bool = false;
			}
	
		}


		allNodes = nodeList.concat(endNodes);	
		console.log(allNodes);
		console.log(JSON.stringify(allNodes));

		var xhr = new XMLHttpRequest();
		xhr.open("POST", nodeRedUrl, true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		// send the collected data as JSON
		xhr.send(JSON.stringify(nodeList));


	}

	function createNode(type,len,i,j,first){

		node = "";
	
		//type-specific node constructs
		if(type=="trigger"){
			node = JSON.parse(JSON.stringify(triggerTemplate));
			node.duration = ""+len;
			// link to appropriate output
			if(node.wires == undefined){
				node.wires = [[endNodes[j].id]];
			}else{
				node.wires[0].push(endNodes[j].id);
			}
		
		}else if(type=="delay"){
			node = JSON.parse(JSON.stringify(delayTemplate));
			node.timeout = ""+len;
		}else if(type=="start"){
			node = JSON.parse(JSON.stringify(leftClick));
		}

		node.id = "rec:"+type+":"+idCounter;
		idCounter++;

		//add to nodes array
		if(nodeList == undefined){
			nodeList = [node];
		}else{
			nodeList.push(node);
		}

	
		if(prevNode==-1){
			// the start node, so return earlier
			node.x = (i+1)+offset;
			node.y = (j+1)+offset;
			prevNode++;
			return node.id;
		}
	
	
		//positioning
		node.x = ((i+1)*multiplier)+offset;
		node.y = ((j+1)*multiplier)+offset;

		//link to previous node
		if(first){
			//link to start node
			if(nodeList[0].wires == undefined){
				nodeList[0].wires = [[node.id]];
			}else{
				nodeList[0].wires[0].push(node.id);
			}
		}else{
			//link to previous node
			if(nodeList[prevNode].wires == undefined){
				nodeList[prevNode].wires = [[node.id]];
			}else{
				nodeList[prevNode].wires[0].push(node.id);
			}
		}
	
		// increment node counter
		prevNode++;


		return node.id;

	}


}
