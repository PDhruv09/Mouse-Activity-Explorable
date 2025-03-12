document.addEventListener("DOMContentLoaded", function () {
    d3.csv("../assets/data/mouse_data.csv").then(function (data) {
        data.forEach(d => {
            d.Minute = +d.Minute;
            d.Activity = +d.Activity;
        });

        let width = 900, height = 500, margin = { top: 50, right: 80, bottom: 60, left: 70 };
        let svg = d3.select("#staticChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X and Y scales
        let x = d3.scaleLinear().domain([0, 1440]).range([0, width]);
        let y = d3.scaleLinear().domain([0, d3.max(data, d => d.Activity)]).range([height, 0]);

        // Static Line Chart
        let line = d3.line()
            .x(d => x(d.Minute))
            .y(d => y(d.Activity));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(10));

        svg.append("g")
            .call(d3.axisLeft(y));

        // ========================
        // Interactive Visualization
        // ========================
        let svgInteractive = d3.select("#interactiveChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let mice = Array.from(new Set(data.map(d => d.MouseID)));
        let colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(mice);

        let filteredData = data.filter(d => d.MouseID === mice[0]);
        let interactiveLine = d3.line()
            .x(d => x(d.Minute))
            .y(d => y(d.Activity));

        let path = svgInteractive.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", colorScale(mice[0]))
            .attr("stroke-width", 2)
            .attr("d", interactiveLine);

        let selectMenu = d3.select("#interactive-visualization").append("select");
        selectMenu.selectAll("option")
            .data(mice)
            .enter()
            .append("option")
            .text(d => `Mouse ${d}`)
            .attr("value", d => d);

        selectMenu.on("change", function () {
            let selectedMouse = this.value;
            let updatedData = data.filter(d => d.MouseID === selectedMouse);
            path.datum(updatedData).transition().duration(500).attr("d", interactiveLine);
        });
    }).catch(error => console.error("Error loading CSV:", error));
});
