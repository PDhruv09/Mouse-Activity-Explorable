document.addEventListener("DOMContentLoaded", function () {
    d3.csv("../assets/data/mouse_data.csv").then(function (data) {
        data.forEach(d => {
            d.Temperature = +d.Temperature;
            d.Activity = +d.Activity;
            d.Estrus = d.Day % 4 === 2 ? "Estrus" : "Non-Estrus";
        });

        let width = 900, height = 500, margin = { top: 50, right: 100, bottom: 60, left: 70 };
        let svg = d3.select("#staticChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let x = d3.scaleBand().domain(["Estrus", "Non-Estrus"]).range([0, width]).padding(0.3);
        let y = d3.scaleLinear().domain([d3.min(data, d => d.Temperature), d3.max(data, d => d.Temperature)]).range([height, 0]);

        svg.selectAll(".bar")
            .data(["Estrus", "Non-Estrus"])
            .enter().append("rect")
            .attr("x", d => x(d))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d3.mean(data.filter(datum => datum.Estrus === d), d => d.Temperature)))
            .attr("height", d => height - y(d3.mean(data.filter(datum => datum.Estrus === d), d => d.Temperature)))
            .attr("fill", d => d === "Estrus" ? "red" : "blue");

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(y));

        // ========================
        // Interactive Visualization
        // ========================
        let svgInteractive = d3.select("#interactiveChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let colorScale = d3.scaleOrdinal(["red", "blue"]).domain(["Estrus", "Non-Estrus"]);

        let circles = svgInteractive.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(d.Estrus) + x.bandwidth() / 2)
            .attr("cy", d => y(d.Temperature))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Estrus))
            .attr("opacity", 0.7);

        let selectMenu = d3.select("#interactive-visualization").append("select");
        selectMenu.selectAll("option")
            .data(["All", "Estrus", "Non-Estrus"])
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        selectMenu.on("change", function () {
            let selectedPhase = this.value;
            let filteredData = selectedPhase === "All" ? data : data.filter(d => d.Estrus === selectedPhase);
            circles.data(filteredData)
                .transition().duration(500)
                .attr("cy", d => y(d.Temperature))
                .attr("fill", d => colorScale(d.Estrus));
        });
    }).catch(error => console.error("Error loading CSV:", error));
});
