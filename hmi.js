	hmi.mode = "pencil";
	hmi.state = {};

	hmi.addTimelineRow = function (pin, label, oddeven, idx) {
		var tlr = $("<tr></tr>").addClass("timelinerow");

		tlr.addClass("row" + idx);

		tlr.on("mousedown", function() {
			hmi.state.clickedRow = this;
		});

		if (!oddeven) {
			tlr.addClass("even");
		}
	
		$(tlr).append($("<td>" + label + "</td>").addClass("label"));
		for (var i = 0; i < hmi.patternLength; i++) {
			var clickable = $("<td></td>").addClass("cell");
			clickable.addClass("output-" + idx + "-" + i);
			if (i % 10 == 0) {
				clickable.addClass("clickableTen");
			} else {
				clickable.addClass("clickable");
			}
			clickable.on("mousemove", hmi.cellMoveHandler);
			clickable.on("mousedown", function(event) {
				if (hmi.mode == "pencil") {
					$(event.target).addClass("on");
				} else if (hmi.mode == "rubber") {
					$(event.target).removeClass("on");
				}
			});
			$(tlr).append(clickable);
		}
		$("#timeline").append(tlr);
	}

	$(document).on("mousedown", function () {
		hmi.state.mousebutton = 1;
	});

	$(document).on("mouseup", function () {
		hmi.state.mousebutton = 0;
	});

	hmi.cellMoveHandler = function(event) {
		var isOnClickedRow = $(event.target).parents().toArray().indexOf(hmi.state.clickedRow) >=0;
		if (hmi.state.mousebutton == 1 && isOnClickedRow) {
			if (hmi.mode == "pencil") {
				$(event.target).addClass("on");
			} else if (hmi.mode == "rubber") {
				$(event.target).removeClass("on");
			}
		}
	};

	// TIMELINE DATA ACCESSORS AND MUTATORS

	hmi.clearData = function() {
		for (var i = 0; i < hmi.outputs.length; i++) {
			for (var j = 0; j < hmi.patternLength; j++) {
				var cls = "output-" + i + "-" + j;
				var elem = $("." + cls);
				if (elem.hasClass("on")) {
					elem.removeClass("on");
				}
			}
		}
	};

	hmi.getData = function() {
		var obj = {};
		var arr;
		var cls;
		for (var i = 0; i < hmi.outputs.length; i++) {
			arr = [];
			// iterate over all of time
			for (var j = 0; j < hmi.patternLength; j++) {
				cls = "output-" + i + "-" + j;
				if ($("." + cls).hasClass("on")) {
					arr.push(1);
				} else {
					arr.push(0);
				}
			}

			obj[hmi.outputs[i]] = arr;
		}

		return obj;
	};
	
	// like getData but deliberately decouples timeline contents from pin names
	hmi.timelineToArrays = function() {
		var lines = [];
		var arr;
		var cls;
		for (var i = 0; i < hmi.outputs.length; i++) {
			arr = [];
			// iterate over all of time
			for (var j = 0; j < hmi.patternLength; j++) {
				cls = "output-" + i + "-" + j;
				if ($("." + cls).hasClass("on")) {
					arr.push(1);
				} else {
					arr.push(0);
				}
			}

			lines.push(arr);
		};

		return lines;
	}

	// load the timeline from some arrays
	hmi.timelineFromArrays = function(arr) {
		hmi.clearData();
		var cls;
		
		var rowsToRestore = Math.min(arr.length, hmi.outputs.length);
		for (var i = 0; i < rowsToRestore; i++) {
			var data = arr[i];
			var colsToRestore = Math.min(hmi.patternLength, data.length);
			for (var j = 0; j < colsToRestore; j++) {
				cls = "output-" + i + "-" + j;
				if (data[j]) {
					$("." + cls).addClass("on");
				}
			}
		}
	}
	
	// rudimentary save/load
	hmi.saveTimelineAs = function(name) {
		var arrays = hmi.timelineToArrays();
		// create an object because we'll want to save more data later
		var obj = {
			data: arrays
		};
		
		window.localStorage.setItem("dino_" + name, JSON.stringify(obj));
	}
	
	hmi.loadTimelineFrom = function(name) {
		var str = window.localStorage.getItem("dino_" + name);
		if (!str) {
			alert("No such entry '" + name + "' found.");
			return;
		}
		var obj = JSON.parse(str);
		if (!obj || !(obj.data)) {
			alert("Entry '" + name + "' seems to be corrupt or broken.");
			return;
		}
		
		hmi.timelineFromArrays(obj.data);
	}
	
	hmi.listSavedTimelines = function() {
		var items = [];
		for (var i = 0; i < window.localStorage.length; i++) {
			var k = window.localStorage.key(i);
			
			if (k.indexOf("dino_") == 0) {
				k = k.substr(5);
				items.push(k);
			}
		}
		return items;
	}

	$(function() {
		for (var i = 0; i < hmi.outputs.length; i++) {
			hmi.addTimelineRow(hmi.outputs[i], hmi.outputs[i], i % 2, i);
		}

		$("#pencil").on("click", function() {
			hmi.mode = "pencil";
		});

		$("#rubber").on("click", function() {
			hmi.mode = "rubber";
		});

		$("#deployButton").on("click", function() {
			var data = hmi.timelineToArrays();
			var json = JSON.stringify(data);
			$("#outputBox").text(json);
		});

		$("#magicButton").on("click", function(e) {
			if (window.magic != undefined) {
				magic(hmi.getData(),hmi.pins);
			}
			e.preventDefault();
		});
		
		$("#loadButton").on("click", function() {
			// populate the loadList
			$("#loadList").empty();
			var list = hmi.listSavedTimelines();
			for (var i = 0; i < list.length; i++) {
				var id = "load_" + list[i];
				$("#loadList").append("<li id='" + id + "'><a href='#main'>" + list[i] + "</a></li>");
				
				// capture the name
				var onclick =(function(name) {
					return function() {
						hmi.loadTimelineFrom(name);
					}
				})(list[i]);
				
				$("#" + id).on("click", onclick);
			}
			$("#loadList").listview("refresh");
		});
		
		$("#saveButton").on("click", function() {
			var name = prompt("Timeline name? (alphanumeric only)", "");
			name = name.replace(/\W/g, '');
			if (name) {
				hmi.saveTimelineAs(name);
			};
		});


	});