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
		console.log("mouse down");
		hmi.state.mousebutton = 1;
	});

	$(document).on("mouseup", function () {
		console.log("mouse up");
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


	});