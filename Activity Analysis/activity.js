document.addEventListener("DOMContentLoaded", function () {
    d3.csv("../assets/data/mouse_data.csv").then(function (data) {
        data.forEach(d => {
            d.Minute = +d.Minute;
            d.Activity = +d.Activity;
            d.Day = +d.Day;
        });

        let width = 900, height = 500, margin = { top: 50, right: 50, bottom: 60, left: 70 };

        let svg = d3.select("#activityChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let x = d3.scaleLinear().domain([0, 1440]).range([0, width - margin.left - margin.right]);
        let y = d3.scaleLinear().domain([0, d3.max(data, d => d.Activity)]).nice().range([height - margin.top - margin.bottom, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Minutes of the Day");

        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -((height - margin.top - margin.bottom) / 2))
            .attr("y", -50)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Activity Level");

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.Minute))
            .attr("cy", d => y(d.Activity))
            .attr("r", 3)
            .attr("fill", "blue")
            .attr("opacity", 0.7);
    }).catch(error => console.error("Error loading CSV:", error));
});
