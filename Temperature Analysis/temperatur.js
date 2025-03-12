document.addEventListener("DOMContentLoaded", function () {
    d3.csv("../assets/data/mouse_data.csv").then(function (data) {
        data.forEach(d => {
            d.Minute = +d.Minute;
            d.Temperature = +d.Temperature;
            d.Day = +d.Day;
        });

        let width = 900, height = 500, margin = { top: 50, right: 120, bottom: 80, left: 80 };

        let svg = d3.select("#temperatureChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let x = d3.scaleLinear().domain([0, 1440]).range([0, width - margin.left - margin.right]);
        let y = d3.scaleLinear().domain([d3.min(data, d => d.Temperature), d3.max(data, d => d.Temperature)]).nice().range([height - margin.top - margin.bottom, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10));

        svg.append("g")
            .call(d3.axisLeft(y));

        // Tooltip
        let tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("visibility", "hidden");

        // Line chart
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.Minute))
                .y(d => y(d.Temperature))
            );

        // Interactive circles on line
        svg.selectAll(".temp-dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.Minute))
            .attr("cy", d => y(d.Temperature))
            .attr("r", 4)
            .attr("fill", "red")
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(`Minute: ${d.Minute} <br> Temp: ${d.Temperature}°C`)
                    .style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
                d3.select(this).attr("r", 7).attr("fill", "blue");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this).attr("r", 4).attr("fill", "red");
            });

    }).catch(error => console.error("Error loading CSV:", error));
});
