document.addEventListener("DOMContentLoaded", function () {
    const maleDataPath = "../assets/data/Mouse_Data_Student_Copy Male Temp.csv";
    const femaleDataPath = "../assets/data/Mouse_Data_Student_Copy Fem Temp.csv";

    async function formatData(filePath, gender) {
        const rawData = await d3.csv(filePath);
        const mouseIDs = Object.keys(rawData[0]);
        return rawData.flatMap((row, minute) => 
            mouseIDs.map(mouseID => ({
                Minute: +minute,
                MouseID: mouseID,
                Temperature: +row[mouseID],
                Gender: gender
            }))
        );
    }

    Promise.all([
        formatData(maleDataPath, 'Male'),
        formatData(femaleDataPath, 'Female')
    ]).then(([maleData, femaleData]) => {
        const allData = [...maleData, ...femaleData];

        const margin = {top: 40, right: 120, bottom: 60, left: 70};
        const width = 900 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // ====================
        // 1. Density Heat Map
        // ====================
        function drawHeatmap(data, divId) {
            const svg = d3.select(divId).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            const xScale = d3.scaleLinear().domain([0, d3.max(data, d => d.Minute)]).range([0, width]);
            const yScale = d3.scaleLinear().domain([35, 40]).range([height, 0]);

            // Compute average temperature per minute for each gender
            const maleAvg = d3.rollup(maleData, v => d3.mean(v, d => d.Temperature), d => d.Minute);
            const femaleAvg = d3.rollup(femaleData, v => d3.mean(v, d => d.Temperature), d => d.Minute);

            const aggregatedData = Array.from(maleAvg.keys()).map(minute => {
                const maleTemp = maleAvg.get(minute) || 0;
                const femaleTemp = femaleAvg.get(minute) || 0;
                return {
                    Minute: minute,
                    Temperature: Math.max(maleTemp, femaleTemp),
                    DominantGender: maleTemp > femaleTemp ? "Male" : "Female"
                };
            });

            const colorScaleMale = d3.scaleSequential(d3.interpolateBlues).domain([36, 39]);
            const colorScaleFemale = d3.scaleSequential(d3.interpolateReds).domain([36, 39]);

            svg.selectAll("circle")
                .data(aggregatedData)
                .join("circle")
                .attr("cx", d => xScale(d.Minute))
                .attr("cy", d => yScale(d.Temperature))
                .attr("r", 3)
                .attr("fill", d => d.DominantGender === "Male" ? colorScaleMale(d.Temperature) : colorScaleFemale(d.Temperature))
                .attr("opacity", 0.7);

            svg.append("g").call(d3.axisLeft(yScale))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -50)
                .attr("x", -height / 2)
                .attr("fill", "#000")
                .text("Temperature (°C)");

                svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale))
                .append("text")
                .attr("x", width / 2)
                .attr("y", 50)
                .attr("fill", "#000")
                .text("Minute");

            svg.append("text")  
                .attr("x", width - 120)
                .attr("y", 10)
                .attr("fill", "black")
                .attr("font-size", "14px")
                .text("Legend");

            // Add Legend
            const legend = svg.append("g").attr("transform", `translate(${width - 100}, 10)`);
            legend.append("rect").attr("width", 20).attr("height", 20).attr("fill", "blue");
            legend.append("text").attr("x", 30).attr("y", 15).text("Male Dominant");
            legend.append("rect").attr("width", 20).attr("height", 20).attr("y", 30).attr("fill", "red");
            legend.append("text").attr("x", 30).attr("y", 45).text("Female Dominant");
        }
        drawHeatmap(allData, "#averageTemperatureHeatmap");

        // ====================
        // 2. Static Visualization (Each Mouse with Temperature Y-Axis)
        // ====================
        // ====================
        // 1. Compute Average Temperature Per Mouse
        // ====================
        function calculateMouseAverages(data) {
            return d3.rollups(data, v => d3.mean(v, d => d.Temperature), d => d.MouseID)
                .map(d => ({ MouseID: d[0], AvgTemp: d[1] }));
        }
        
        const maleAverages = calculateMouseAverages(maleData);
        const femaleAverages = calculateMouseAverages(femaleData);
        const allAverages = [...maleAverages, ...femaleAverages];

        // Compute overall average temperature
        const overallAvg = d3.mean(allAverages, d => d.AvgTemp);

        // ====================
        // 2. Draw Average Temperature Per Mouse
        // ====================
        function drawMouseAveragePlot(data, divId) {
            const svg = d3.select(divId).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            const xScale = d3.scaleBand().domain(data.map(d => d.MouseID)).range([0, width]).padding(0.2);
            const yScale = d3.scaleLinear().domain([35, 40]).range([height, 0]);

            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.MouseID));

            svg.selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", d => xScale(d.MouseID))
                .attr("y", d => yScale(d.AvgTemp))
                .attr("width", xScale.bandwidth())
                .attr("height", d => height - yScale(d.AvgTemp))
                .attr("fill", d => colorScale(d.MouseID));

            svg.append("g").call(d3.axisLeft(yScale)).append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -50)
                .attr("x", -height / 2)
                .attr("fill", "#000")
                .text("Temperature (°C)");

            svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale))
                .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

            svg.append("text")  
                .attr("x", width - 120)
                .attr("y", 10)
                .attr("fill", "black")
                .attr("font-size", "14px")
                .text("Legend");
            // Draw overall average temperature line
            svg.append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", yScale(overallAvg))
                .attr("y2", yScale(overallAvg))
                .attr("stroke", "black")
                .attr("stroke-dasharray", "4");

            svg.append("g").call(d3.axisLeft(yScale))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -50)
                .attr("x", -height / 2)
                .attr("fill", "#000")
                .text("Temperature (°C)");
            
            svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale))
                .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");

            // Add legend
            const legend = svg.append("g").attr("transform", `translate(${width + 20}, 20)`);
            data.forEach((d, i) => {
                legend.append("rect").attr("x", 0).attr("y", i * 20).attr("width", 15).attr("height", 15).attr("fill", colorScale(d.MouseID));
                legend.append("text").attr("x", 20).attr("y", i * 20 + 12).text(d.MouseID).style("font-size", "12px");
            });
        }

        drawMouseAveragePlot(femaleAverages, "#femaleTemperatureChart");
        drawMouseAveragePlot(maleAverages, "#maleTemperatureChart");

        // ====================
        // Interactive Visualization
        // ====================
        // Populate mouse selection dropdown
        const mouseSelection = d3.select("#mouseSelection");
        const allMouseIDs = Array.from(new Set(allData.map(d => d.MouseID)));
        allMouseIDs.forEach(mouse => {
            mouseSelection.append("option").text(mouse).attr("value", mouse);
        });

        // Checkboxes for averages
        const avgFemaleCheckbox = d3.select("#avgFemale");
        const avgMaleCheckbox = d3.select("#avgMale");
        const avgAllCheckbox = d3.select("#avgAll");

        function calculateAvgTemp(data) {
            return d3.rollups(data, v => d3.mean(v, d => d.Temperature), d => d.Minute)
                .map(d => ({ Minute: d[0], AvgTemp: d[1] }));
        }
        
        function updateInteractiveChart() {
            const selectedMice = Array.from(mouseSelection.node().selectedOptions, opt => opt.value);
            const selectedData = allData.filter(d => selectedMice.includes(d.MouseID));
            
            const femaleSelected = selectedData.filter(d => d.Gender === "Female");
            const maleSelected = selectedData.filter(d => d.Gender === "Male");

            const avgFemale = calculateAvgTemp(femaleSelected);
            const avgMale = calculateAvgTemp(maleSelected);
            const avgAll = calculateAvgTemp(selectedData);

            const svg = d3.select("#interactiveTemperatureChart").html("").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            const xScale = d3.scaleLinear().domain([0, d3.max(selectedData, d => d.Minute)]).range([0, width]);
            const yScale = d3.scaleLinear().domain([35, 40]).range([height, 0]);
            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedMice);

            selectedMice.forEach(mouse => {
                const mouseData = selectedData.filter(d => d.MouseID === mouse);
                svg.append("path").datum(mouseData)
                    .attr("fill", "none").attr("stroke", colorScale(mouse)).attr("d",
                        d3.line().x(d => xScale(d.Minute)).y(d => yScale(d.Temperature)));
            });

            if (avgFemaleCheckbox.node().checked) {
                svg.append("path").datum(avgFemale)
                    .attr("fill", "none").attr("stroke", "red").attr("stroke-width", 2)
                    .attr("d", d3.line().x(d => xScale(d.Minute)).y(d => yScale(d.AvgTemp)));
            }

            if (avgMaleCheckbox.node().checked) {
                svg.append("path").datum(avgMale)
                    .attr("fill", "none").attr("stroke", "blue").attr("stroke-width", 2)
                    .attr("d", d3.line().x(d => xScale(d.Minute)).y(d => yScale(d.AvgTemp)));
            }

            if (avgAllCheckbox.node().checked) {
                svg.append("path").datum(avgAll)
                    .attr("fill", "none").attr("stroke", "black").attr("stroke-width", 2)
                    .attr("d", d3.line().x(d => xScale(d.Minute)).y(d => yScale(d.AvgTemp)));
            }

            svg.append("g").call(d3.axisLeft(yScale)).append("text")
                .attr("transform", "rotate(-90)").attr("y", -50).attr("x", -height / 2)
                .attr("fill", "#000").text("Temperature (°C)");

            svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale))
                .append("text").attr("x", width / 2).attr("y", 40).attr("fill", "#000").text("Minute");

            // Legend
            const legend = svg.append("g").attr("transform", `translate(${width + 10},0)`);
            legend.append("text").attr("y", 0).attr("fill", "black").text("Legend:");
            selectedMice.forEach((mouse, index) => {
                legend.append("rect").attr("x", 0).attr("y", 20 * (index + 1)).attr("width", 10).attr("height", 10)
                    .attr("fill", colorScale(mouse));
                legend.append("text").attr("x", 15).attr("y", 20 * (index + 1) + 10).text(mouse);
            });
            if (avgFemaleCheckbox.node().checked) {
                legend.append("rect").attr("x", 0).attr("y", 20 * (selectedMice.length + 1)).attr("width", 10).attr("height", 10).attr("fill", "red");
                legend.append("text").attr("x", 15).attr("y", 20 * (selectedMice.length + 1) + 10).text("Avg Selected Female");
            }

            if (avgMaleCheckbox.node().checked) {
                legend.append("rect").attr("x", 0).attr("y", 20 * (selectedMice.length + 2)).attr("width", 10).attr("height", 10).attr("fill", "blue");
                legend.append("text").attr("x", 15).attr("y", 20 * (selectedMice.length + 2) + 10).text("Avg Selected Male");
            }

            if (avgAllCheckbox.node().checked) {
                legend.append("rect").attr("x", 0).attr("y", 20 * (selectedMice.length + 3)).attr("width", 10).attr("height", 10).attr("fill", "black");
                legend.append("text").attr("x", 15).attr("y", 20 * (selectedMice.length + 3) + 10).text("Avg All Selected");
            }
        }

        mouseSelection.on("change", updateInteractiveChart);
        avgFemaleCheckbox.on("change", updateInteractiveChart);
        avgMaleCheckbox.on("change", updateInteractiveChart);
        avgAllCheckbox.on("change", updateInteractiveChart);
    }).catch(err => console.error("Error loading data:", err));
});
