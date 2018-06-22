var width = window.innerWidth,
    height = window.innerHeight,
    radius = 3,
    fill = "rgba(255, 49, 255, 0.388)",
    stroke = "rgba(0, 0, 0, 0.5)",
    strokeWidth = 0.1;
    fillNegativeCoverage = "#FFE3E5",
    fillPositiveCoverage = "#245899",
    fillNeutralCoverage = "#FF877C ",
    padding = 3;

var colour = d3.scaleLinear()
  .domain([0,100])
  .range([fillNegativeCoverage, fillPositiveCoverage])

var radius = d3.scaleSqrt()
    .domain([0, 15,000])
    .range([0, 30]);

var projection = d3.geoConicEqualArea()
           .translate([width/2, height/2]) 
           .center([-66,8])
           .scale([3000])

var path = d3.geoPath()
            .projection(projection);

var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);            

var g = svg.append("g");

d3.json("./data/VEN.json", function(error, geography){
  if (error) throw error;

  var features = topojson.feature(geography, geography.objects.gadm36_VEN_2).features;
  var country = topojson.feature(geography, geography.objects.gadm36_VEN_2);

  
  var nodes = features.map(function (feature){

    var isNegativeNeutralPositive;
    var dataValueForPositiveOrNegative = feature.properties.Coverage;
    var isUnprotectedNegative =  feature.properties.Unprotected;

    if (isUnprotectedNegative < 0 || isUnprotectedNegative == null ){
      isUnprotectedNegative = 0;
    }

    if (dataValueForPositiveOrNegative < 0){
      isNegativeNeutralPositive = fillNegativeCoverage;
    } else if(dataValueForPositiveOrNegative >=0 && dataValueForPositiveOrNegative <100){
      isNegativeNeutralPositive = colour(dataValueForPositiveOrNegative); 
    } else {
      isNegativeNeutralPositive = fillPositiveCoverage; 
    }

    return {
      centroid: path.centroid(feature),
      unprotected: radius(isUnprotectedNegative),
      coverage: isNegativeNeutralPositive,
      actualCoverage: feature.properties.Coverage,
    };
  });


// function(d) { return d.radius; }
  var forceCollide = 
    d3.forceCollide().radius(function(d) { return d.unprotected/100 + 5; });

  var simulation = d3.forceSimulation()
    // .force("x", d3.forceX(function(d) { return d.centroid[0]; }))
    // .force("y", d3.forceY(function(d) { return d.centroid[1]; }))
    // .force("forceCollide", forceCollide)
    .force("collide", collide)
    .nodes(nodes)
    .on("tick", tick)

  var node = svg.selectAll("rect")
    .data(nodes)
    .enter().append("rect")
      .attr("width", function(d) { return d.unprotected/100 + 5; })
      .attr("height", function(d) { return d.unprotected/100 + 5; })
      .attr("stroke", function (d){ return d.coverage; });

  function tick(e) {
    node.attr("x", function(d) { return d.centroid[0]-d.unprotected/100 + 5; })
        .attr("y", function(d) { return d.centroid[1]-d.unprotected/100 + 5; });
  }


  function collide() {
    for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
      for (var i = 0, n = nodes.length; i < n; ++i) {
        for (var a = nodes[i], j = i + 1; j < n; ++j) {
          var b = nodes[j],
              x = a.x + a.vx - b.x - b.vx,
              y = a.y + a.vy - b.y - b.vy,
              lx = Math.abs(x),
              ly = Math.abs(y),
              r = a.r + b.r + padding;
          if (lx < r && ly < r) {
            if (lx > ly) {
              lx = (lx - r) * (x < 0 ? -strength : strength);
              a.vx -= lx, b.vx += lx;
            } else {
              ly = (ly - r) * (y < 0 ? -strength : strength);
              a.vy -= ly, b.vy += ly;
            }
          }
        }
      }
    }
  }
});

