document.addEventListener("DOMContentLoaded", function () {
    d3.csv("../assets/data/mouse_data.csv").then(function (data) {
        data.forEach(d => {
            d.Minute = +d.Minute;
            d.Temperature = +d.Temperature;
            d.Activity = +d.Activity;
            d.Day = +d.Day;
            d.Estrus = d.Day % 4 === 2 ? "Estrus" : "Non-Estrus"; // Assuming Estrus occurs every 4 days
        });

        let width = 900, height = 500, margin = { top: 50, right: 50, bottom: 60, left: 70 };

        let svg = d3.select("#estrusChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let x = d3.scaleLinear().domain([0, 1440]).range([0, width - margin.left - margin.right]);
        let y = d3.scaleLinear().domain([d3.min(data, d => d.Temperature), d3.max(data, d => d.Temperature)]).nice().range([height - margin.top - margin.bottom, 0]);

        let color = d3.scaleOrdinal().domain(["Estrus", "Non-Estrus"]).range(["red", "blue"]);

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
            .text("Body Temperature (°C)");

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.Minute))
            .attr("cy", d => y(d.Temperature))
            .attr("r", 3)
            .attr("fill", d => color(d.Estrus))
            .attr("opacity", 0.7);
    }).catch(error => console.error("Error loading CSV:", error));
});
