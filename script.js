// Global var
var EUorIt = "EU";
var selectedYear;
var projection;
var projection2;
var dataBC;
var myworld;
var africa;
var datamap1EU;
var datamap1it;
var datamap2;
var datainfo;
var datapie;
var formatComma = d3.format(",");


function createGroupBC() {
    // set the dimensions and margins of the graph
    var margin = {top: 100, right: 40, bottom: 50, left: 80},
        width = 500 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var data = dataBC

    // List of subgroups = header of the csv files = soil condition here
    var subgroups = data.columns.slice(1)

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = d3.map(data, function(d){return(d.YEAR)}).keys()

    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2])

    d3.select("#xAxis")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + (margin.top + height) + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-50)");

    var y = d3.scaleLinear()
        .domain([0, 260000])
        .range([ height, 0 ]);

    d3.select("#yAxis")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("y", 1)
        .style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em");

    // Another scale for subgroup position?
    var xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.05])

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#8787c5','#5353ac']);

    var bc = d3.select("#bars")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Show the bars
    bc.append("g")
        .selectAll("g")
        // Enter in data = loop group per group
        .data(dataBC)
        .enter()
        .append("g")
        //.attr("id", function(d){ return d.year; })
        .attr("transform", function(d) { return "translate(" + x(d.YEAR) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
        .enter().append("rect")
        .attr("x", function(d) { return xSubgroup(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", xSubgroup.bandwidth())
        .attr("height", function(d) { return height - y(d.value); })
        .attr("fill", function(d) { return color(d.key); })
        .on('mouseover', function (d) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.55');
        })
        .on('mouseout', function (d) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
        })

        .on('click', function(d) {
            d3.select('#bars')
                .selectAll("rect")
                .classed("selected", false);
            d3.select(this).classed("selected", true);

            updateInfo(d);

        });

    // Legend
    var g = d3.select("#legend-bar")
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(100,100)");
    g.append("text")
        .attr("class", "caption")
        .attr("x", 0)
        .attr("y", -6)
        .text("Destination");
    var labels = ['Europe', 'Italy'];
    var legend = d3.legendColor()
        .labels(function (d) { return labels[d.i]; })
        .shapePadding(4)
        .scale(color);
    d3.select("#legend-bar").select(".legend")
        .call(legend);

}
function createInfoPanel(){
    d3.select("#year").text("2013-2018");
    d3.select("#destination").text("Europe");

    var ul = d3.select("#Acountries")
        .selectAll("li")
        .data(datamap1EU)
        .classed("list-group-item", true)
        //console.log("d=",data.countryName)
        .html(function (d) {return d.countryName + "- " + formatComma(d.tot);});
    ul.enter()
        .append('li')
        .classed("list-group-item", true)
        .html(function (d) {return d.countryName + "- " + formatComma(d.tot);});

    ul.exit().remove();

}

//Update the info panel to show info about the currently selected year and destination
function updateInfo(bcdata) {
    // Update the text elements in the infoBox
    if (bcdata.key === "Italy") {
        datainfo = datamap1it;
    }
    if (bcdata.key === "Europe") {
        datainfo = datamap1EU;
    }

    function myfunc (key){
        if (key === "Italy") {
            return dataBC.filter(data=> data.Italy === bcdata.value)[0].year;
        }
        if (key === "Europe") {
            return dataBC.filter(data=> data.Europe === bcdata.value)[0].year;
        }
    }

    var selectedYear = myfunc(bcdata.key);
    var selectedDest = bcdata.key;

    d3.select("#year").text(selectedYear);
    d3.select("#destination").text(selectedDest);

    var ul = d3.select("#Acountries")
        .selectAll("li")
        .data(datainfo)
        .classed("list-group-item", true)
        .html(function (d) {return d.countryName + "- " + formatComma(d[selectedYear]);});
    ul.enter()
        .append('li')
        .classed("list-group-item", true)
        .html(function (d) {return d.countryName + "- " + formatComma(d[selectedYear]);});

    ul.exit().remove();
}


function drawMap(world, data, mvalue) {
    selectedYear = mvalue;
    //alert("draw map works");
    projection = d3.geoConicConformal().scale(250).translate([200, 200]);

    var path = d3.geoPath().projection(projection);
    var wmap = 700 , hmap = 500;
    var tooltip = d3.select("div.tooltip");

    var colorScale = d3.scaleLinear()
        .domain([d3.min(data, function (d) {return d[mvalue] ;}),
            d3.max(data, function (d) {return d[mvalue] ;})
        ])
        .range(["lightblue", "darkblue"]);

    var country = d3.select("#map")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.collection).features)
        .enter()
        .append("path")
        .attr("width", wmap)
        .attr("height", hmap)
        .attr("d", path)
        .classed("countries", true)
        .style("fill", function(d){
            //get the data value
            var Value = findValueByName(data, d.properties.name, mvalue);
            if(Value){
                //If value exists
                return colorScale(Value);
            } else {
                // If value is undefined
                return "#ccc"
            }

        })

        .on("mouseover",function(d){
            d3.select(this).attr("stroke-width",2);
            return tooltip.style("hidden", false)
                .html("Name: " + d.properties.name + "<br/>"
                    + "request: " + formatComma(findValueByName(data, d.properties.name, mvalue)) + "<br/>"
                    + "population: " + formatComma(findValueByName(datamap2, d.properties.name, "population")) );
        })
        .on("mousemove",function(d){
            tooltip.classed("hidden", false)
                .style("top", (d3.event.pageY) + "px")
                .style("left", (d3.event.pageX + 10) + "px")
                .html("Name: " + d.properties.name + "<br/>"
                    + "request: " + formatComma(findValueByName(data, d.properties.name, mvalue)) + "<br/>"
                    + "population: " + formatComma(findValueByName(datamap2, d.properties.name, "population")) );
        })
        .on("mouseout",function(d,i){
            d3.select(this).attr("stroke-width",1);
            tooltip.classed("hidden", true);
        });
}

function clearMap() {
    d3.select("#map").selectAll("path")
        .remove("path");
}

function selectDest(dest){
  EUorIt = dest;
  updateMap(myworld, selectedYear)
}

function updateMap(world, mvalue) {
    //Clear any previous selections;
    selectedYear = mvalue;
    data = EUorIt=="IT" ? datamap1it : datamap1EU;
    clearMap();
    d3.selectAll("#select-year button").classed("active", false);
    d3.select("#button-" + mvalue).classed("active", true);
    //alert("update map works");
    projection = d3.geoConicConformal().scale(250).translate([200, 200]);

    var path = d3.geoPath().projection(projection);
    var wmap = 700 , hmap = 500;
    var tooltip = d3.select("div.tooltip");

    var colorScale = d3.scaleLinear()
        .domain([d3.min(data, function (d) {return d[mvalue] ;}),
            d3.max(data, function (d) {return d[mvalue] ;})
        ])
        .range(["lightblue", "darkblue"]);


    var country = d3.select("#map")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.collection).features)
        .enter()
        .append("path")
        .attr("width", wmap)
        .attr("height", hmap)
        .attr("d", path)
        .classed("countries", true)
        .style("fill", function(d){
            //get the data value
            var Value = findValueByName(data, d.properties.name, mvalue);
            if(Value){
                //If value exists
                return colorScale(Value);
            } else {
                // If value is undefined
                return "#ccc"
            }
        })
        .on("mouseover",function(d){
            d3.select(this).attr("stroke-width",2);
            return tooltip.style("hidden", false)
                .html("Name: " + d.properties.name + "<br/>"
                + "request: " + formatComma(findValueByName(data, d.properties.name, mvalue))+ "<br/>"
                    + "population: " + formatComma(findValueByName(datamap2, d.properties.name, "population")) );
        })
        .on("mousemove",function(d){
            tooltip.classed("hidden", false)
                .style("top", (d3.event.pageY) + "px")
                .style("left", (d3.event.pageX + 10) + "px")
                .html("Name: " + d.properties.name + "<br/>"
                    + "request: " + formatComma(findValueByName(data, d.properties.name, mvalue)) + "<br/>"
                    + "population: " + formatComma(findValueByName(datamap2, d.properties.name, "population")));
        })
        .on("mouseout",function(d,i){
            d3.select(this).attr("stroke-width",1);
            tooltip.classed("hidden", true);
        });
}

function findValueByName(data, name, value) {

    if(data.filter(data => data.countryName === name)[0]){
        var val = data.filter(data => data.countryName === name)[0][value];
        //If value exists
        return val;
    } else {
        // If value is undefined
        //we do this because some countries are not in dataset we are using but still in projections
        return null;
    }
}

function createPieChart(myId){

    //alert("okey");
    var data = datapie;
    var width = 300;
    var height = 300;
    var padding = 30;
    var tooltip = d3.select("div.tooltip");
    var radius = Math.min(width-padding, height-padding) / 2;
    var color = d3.scaleOrdinal()
        .range(["#fed686", "#f9a65f", "#f06d48", "#f68950"]);
    var pc = d3.select(myId)
        .attr('width', width)
        .attr('height', height);
    var g = pc.append('g')
        .attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');
    var arc = d3.arc()
        .innerRadius(40)
        .outerRadius(radius - 40);
    var labelArc = d3.arc()
        .outerRadius(radius - 120)
        .innerRadius(radius - 10);
    if (myId === "#pieChart1"){
        var pie = d3.pie()
            .value(function(d) { return d.perEU; })
            .sort(null);
        var mytitle = "Europe";
    };
    if (myId === "#pieChart2"){
        var pie = d3.pie()
            .value(function(d) { return d.perIT; })
            .sort(null);
        var mytitle = "Italy";
    };
    var path = g.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d,i) => color(i))
        .style('stroke', 'white')

        .on('click', function(d) {
            d3.selectAll(".pieChart")
                .selectAll("path")
                .classed("selected", false);
            d3.select(this).classed("selected", true);
            createInfoPie(d.data.level);
        })

        .on("mouseover",function(d){
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.8').style('stroke', 'black');
            return tooltip.style("hidden", false)
                .html("Income: " + d.data.level + "<br/>"
                    + "Request: " + d.value + "%" + "<br/>"
                    + "Population: " + d.data.pop + "(" + d.data.pop_per + "%)"
                );
        })
        .on("mousemove",function(d){
            //console.log(d);
            tooltip.classed("hidden", false)
                .style("top", (d3.event.pageY) + "px")
                .style("left", (d3.event.pageX + 10) + "px")
                .html("Income: " + d.data.level + "<br/>"
                    + "Request: " + d.value + "%" + "<br/>"
                    + "Population: " + d.data.pop + "(" + d.data.pop_per + "%)"
                );
        })
        .on("mouseout",function(d,i){
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1').style('stroke', 'white');
            tooltip.classed("hidden", true);
        });
    // add the annotation. Use the centroid method to get the best coordinates
    g.selectAll("text")
        .data(pie(data))
        .enter()
        .append('text')
        .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")";  })
        .text(function(d){
            return d.data.level;})
        .style("text-anchor", "middle")
        .attr("opacity", ".5")
        .style("font-weight", "bold")
        .style("font-size", ".8em");

    // add the title
    g.append("text")
        .attr("text-anchor", "middle")
        .attr('font-size', '1.2em')
        .text(mytitle)
        .attr("opacity", ".65")
        .style("font-family", "'Ubuntu', sans-serif");
};

function createInfoPie(level){

    d3.select("#mytable").classed("d-none", false);
    var col1 = d3.select("#info-pie1")
        .selectAll("tr")
        .data(filteredData(level))
        .html(function (d) {return d.countryName;})
    col1.enter()
        .append('tr')
        .html(function (d) {return d.countryName;});
    col1.exit().remove();

    var col2 = d3.select("#info-pie2")
        .selectAll("tr")
        .data(filteredData(level))
        .html(function (d) {return formatComma(d.income);})
    col2.enter()
        .append('tr')
        .html(function (d) {return formatComma(d.income);});
    col2.exit().remove();
}

function filteredData(level) {
    var data = datamap2;
    var val = [];
    if (level === "low"){
        val = data.filter(d => d.income < 1000);
    }
    if (level === "M-low"){
        val = data.filter(d => d.income < 4000 && d.income > 1000);
    }
    if (level === "M-high"){
        val = data.filter(d => d.income < 12000 && d.income > 4000);
    }
    if (level === "High"){
        val = data.filter(d => d.income > 12000);
    }
    return val;

}


function incomeMap(world, data, mvalue) {

    projection2 = d3.geoConicConformal().scale(250).translate([200, 200]);

    var path = d3.geoPath().projection(projection2);
    var wmap = 500 , hmap = 400;
    var tooltip = d3.select("div.tooltip");

    var colorScale = d3.scaleThreshold()
        .domain([1000, 4000, 12000])
        .range(["#fed686", "#f9a65f", "#f68950", "#f06d48"]);

    var country = d3.select("#map2")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.collection).features)
        .enter()
        .append("path")
        .attr("width", wmap)
        .attr("height", hmap)
        .attr("d", path)
        .classed("countries", true)
        .style("fill", function(d){
            //get the data value
            var Value = findValueByName(data, d.properties.name, mvalue);
            if(Value){
                //If value exists
                return colorScale(Value);
            } else {
                // If value is undefined
                return "#ccc"
            }
        })
        .on("mouseover",function(d){
            d3.select(this).attr("stroke-width",2);
            return tooltip.style("hidden", false)
                .html("Name: " + d.properties.name + "<br/>"
                    + "Income (PPP): " + formatComma(findValueByName(data, d.properties.name, mvalue)) + "<br/>"
                    + "Population: " + formatComma(findValueByName(data, d.properties.name, "population")) + "<br/>"
                    + "request for Europe: " + formatComma(findValueByName(data, d.properties.name, "req_EU")) + "<br/>"
                    + "request for Italy: " + formatComma(findValueByName(data, d.properties.name, "req_it")) + "<br/>"
                    + "req/pop (EU): " + findValueByName(data, d.properties.name, "req/pop_EU") + "<br/>"
                    + "req/pop (It): " + findValueByName(data, d.properties.name, "req/pop_it") + "<br/>"
                );
        })
        .on("mousemove",function(d){
            tooltip.classed("hidden", false)
                .style("top", (d3.event.pageY) + "px")
                .style("left", (d3.event.pageX + 10) + "px")
                .html("Name: " + d.properties.name + "<br/>"
                    + "Income (PPP): " + formatComma(findValueByName(data, d.properties.name, mvalue)) + "<br/>"
                    + "Population: " + formatComma(findValueByName(data, d.properties.name, "population")) + "<br/>"
                    + "request for Europe: " + formatComma(findValueByName(data, d.properties.name, "req_EU")) + "<br/>"
                    + "request for Italy: " + formatComma(findValueByName(data, d.properties.name, "req_it")) + "<br/>"
                    + "req/pop (EU): " + findValueByName(data, d.properties.name, "req/pop_EU") + "<br/>"
                    + "req/pop (It): " + findValueByName(data, d.properties.name, "req/pop_it") + "<br/>"
                );
        })
        .on("mouseout",function(d,i){
            d3.select(this).attr("stroke-width",1);
            tooltip.classed("hidden", true);
        });


    // Legend
    var g = d3.select("#legend-map2")
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(50,220)");
    g.append("text")
        .attr("class", "caption")
        .attr("x", 0)
        .attr("y", -6)
        .text("Income");
    var labels = ['0-1,000', '1,000-4,000', '4,000-12,000', '>12,000'];
    var legend = d3.legendColor()
        .labels(function (d) { return labels[d.i]; })
        .shapePadding(4)
        .scale(colorScale);
    d3.select("#legend-map2").select(".legend")
        .call(legend);

};

/* DATA LOADING */

d3.json("data/world.json", function (error, world) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }
    africa = world;
    d3.csv("data/map2.csv", function (error, csv) {
        if (error) {
            console.log(error);  //Log the error.
            throw error;
        }

        // Store csv data in a global variable
        datamap2 = csv;
        incomeMap(africa, datamap2, "income");
    });
    myworld = world;
    d3.csv("data/map1EU.csv", function (error, data) {
        if (error) {
            console.log(error);  //Log the error.
            throw error;
        }

        data.forEach(function (d) {
            // Convert numeric values to 'numbers'
            d[2013] = +d[2013];
            d[2014] = +d[2014];
            d[2015] = +d[2015];
            d[2016] = +d[2016];
            d[2017] = +d[2017];
            d[2018] = +d[2018];
            d.tot = +d.tot;
        });

        // Store csv data in a global variable
        datamap1EU = data;
        drawMap(myworld, datamap1EU, "tot");
        createInfoPanel();
    });


});

d3.csv("data/migrants.csv", function (error, csv) {
    if (error) {
        console.log(error);  //Log the error.
	throw error;
    }

    csv.forEach(function (d) {

        // Convert numeric values to 'numbers'
        d.year = +d.YEAR;
        d.EU = +d.Europe;
        d.Italy = +d.Italy;

    });

    // Store csv data in a global variable
    dataBC = csv;

    d3.csv("data/map1it.csv", function (error, data) {
        if (error) {
            console.log(error);  //Log the error.
            throw error;
        }

        data.forEach(function (d) {
            // Convert numeric values to 'numbers'
            d[2013] = +d[2013];
            d[2014] = +d[2014];
            d[2015] = +d[2015];
            d[2016] = +d[2016];
            d[2017] = +d[2017];
            d[2018] = +d[2018];
            d.tot = +d.tot;
        });

        // Store csv data in a global variable
        datamap1it = data;
    });
    createGroupBC();

});

d3.csv("data/incomes.csv", function (error, csv) {
    if (error) {
        console.log(error);  //Log the error.
        throw error;
    }

    // Store csv data in a global variable
    datapie = csv;
    createPieChart("#pieChart1");
    createPieChart("#pieChart2");
});

$(document).ready(function(){
    $("#myInput").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $("#Acountries li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

