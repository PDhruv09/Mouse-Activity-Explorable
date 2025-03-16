document.addEventListener("DOMContentLoaded", function () {
    // File paths for data
    const femaleTempPath = "../assets/data/Mouse_Data_Student_Copy Fem Temp.csv";
    const femaleActPath = "../assets/data/Mouse_Data_Student_Copy Fem Act.csv";
    
    // Function to load and process CSV files
    function loadAndProcessCSV(filePath) {
        return d3.csv(filePath).then(data => {
            let formattedData = [];
            let mouseIDs = Object.keys(data[0]); // Extract column headers as mouse IDs

            data.forEach((row, index) => {
                let day = Math.floor(index / 1440) + 1; // Convert row index to Day
                let timeOfDay = index % 1440; // Convert index into Minutes within a day
                
                mouseIDs.forEach(mouseID => {
                    formattedData.push({
                        MouseID: mouseID,
                        Day: day,
                        TimeOfDay: timeOfDay,
                        Value: +row[mouseID] || 0 // Convert value to number
                    });
                });
            });
            return formattedData;
        });
    }

    // Load both temperature and activity data
    Promise.all([loadAndProcessCSV(femaleTempPath), loadAndProcessCSV(femaleActPath)]).then(([tempData, actData]) => {
        let combinedData = tempData.map((tempEntry, index) => {
            let actEntry = actData[index];
            return {
                ...tempEntry,
                Activity: actEntry.Value // Add activity level
            };
        });

        // Populate dropdown with female mouse IDs
        const mouseSelect = document.getElementById("mouseSelect");
        let uniqueMice = [...new Set(combinedData.map(d => d.MouseID))];
        uniqueMice.forEach(mouse => {
            let option = document.createElement("option");
            option.value = mouse;
            option.textContent = mouse;
            mouseSelect.appendChild(option);
        });

        // Visualization 1: Bar Chart - Average Temperature & Activity Levels
        createBarChart(combinedData);

        // Visualization 2: Line Graph - Temperature Over Time (Cycle On)
        createLineGraph(combinedData, "On");

        // Visualization 3: Line Graph - Temperature Over Time (Cycle Off)
        createLineGraph(combinedData, "Off");

        // Visualization 4: Interactive Line Chart
        createInteractiveChart(combinedData);
    });

    // Function to create a grouped bar chart
    function createBarChart(data) {
        const margin = { top: 50, right: 50, bottom: 60, left: 70 };
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // Aggregate data
        let avgTempOn = d3.mean(data.filter(d => d.Day % 4 === 2), d => d.Value);
        let avgTempOff = d3.mean(data.filter(d => d.Day % 4 !== 2), d => d.Value);
        let avgActOn = d3.mean(data.filter(d => d.Day % 4 === 2), d => d.Activity);
        let avgActOff = d3.mean(data.filter(d => d.Day % 4 !== 2), d => d.Activity);
        
        let chartData = [
            { category: "Estrus ON", type: "Activity", value: avgActOn },
            { category: "Estrus ON", type: "Temperature", value: avgTempOn },
            { category: "Estrus OFF", type: "Activity", value: avgActOff },
            { category: "Estrus OFF", type: "Temperature", value: avgTempOff }
        ];

        // Define colors
        const colorMap = { "Activity": "red", "Temperature": "blue" };

        const svg = d3.select("#staticChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Scales
        const x0Scale = d3.scaleBand()
            .domain(["Estrus ON", "Estrus OFF"])
            .range([0, width])
            .padding(0.2);
        
        const x1Scale = d3.scaleBand()
            .domain(["Activity", "Temperature"])
            .range([0, x0Scale.bandwidth()])
            .padding(0.1);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.value)])
            .nice()
            .range([height, 0]);

        // Draw bars
        svg.selectAll(".bar-group")
            .data(chartData)
            .enter()
            .append("rect")
            .attr("x", d => x0Scale(d.category) + x1Scale(d.type))
            .attr("width", x1Scale.bandwidth())
            .attr("y", d => yScale(d.value))
            .attr("height", d => height - yScale(d.value))
            .attr("fill", d => colorMap[d.type]);

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0Scale));

        // Add y-axis
        svg.append("g").call(d3.axisLeft(yScale));

        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Estrus Cycle");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Average Value");

        // Legend (moved 30px to the right)
        const legend = svg.append("g")
        .attr("transform", `translate(${width - 60},${margin.top})`); // Adjusted x-position

        Object.entries(colorMap).forEach(([key, color], i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", color);

            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 12)
                .style("font-size", "12px")
                .text(key);
        });
    }

    // Function to create line graphs for both Cycle On and Cycle Off
    // Function to create a line graph with average temperature and thickness based on average activity
    function createLineGraph(data, cycle) {
        const margin = { top: 50, right: 70, bottom: 80, left: 90 };
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Select the appropriate chart container based on cycle
        const svg = d3.select(cycle === "On" ? "#onCycleChart" : "#offCycleChart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Filter data based on cycle
        let filteredData = data.filter(d => (cycle === "On" ? d.Day % 4 === 2 : d.Day % 4 !== 2));

        // Group data by MouseID and TimeOfDay to compute per-mouse averages
        let miceGrouped = d3.group(filteredData, d => d.MouseID);
        let mouseAverages = [];

        miceGrouped.forEach((entries, mouseID) => {
            let timeGrouped = d3.group(entries, d => d.TimeOfDay);
            let avgData = Array.from(timeGrouped, ([time, records]) => {
                return {
                    MouseID: mouseID,
                    TimeOfDay: time,
                    AvgTemp: d3.mean(records, d => d.Value),
                    AvgActivity: d3.mean(records, d => d.Activity)
                };
            });
            mouseAverages.push(...avgData);
        });

        // Compute overall averages for all mice at each time of day
        let timeGroupedOverall = d3.group(mouseAverages, d => d.TimeOfDay);
        let overallAverages = Array.from(timeGroupedOverall, ([time, records]) => {
            return {
                TimeOfDay: time,
                AvgTemp: d3.mean(records, d => d.AvgTemp),
                AvgActivity: d3.mean(records, d => d.AvgActivity)
            };
        });

        // Define color scale for mice
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Define scales ensuring they fit within the chart area
        const xScale = d3.scaleLinear()
            .domain(d3.extent(mouseAverages, d => d.TimeOfDay))
            .nice()
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(mouseAverages, d => d.AvgTemp))
            .nice()
            .range([height, 0]);

        // Define scale for line thickness based on activity level
        const thicknessScale = d3.scaleLinear()
            .domain(d3.extent(mouseAverages, d => d.AvgActivity))
            .range([1, 6]); // Ensuring line thickness varies between 1px to 6px

        // Define line generator
        let line = d3.line()
            .x(d => xScale(d.TimeOfDay))
            .y(d => yScale(d.AvgTemp))
            .curve(d3.curveMonotoneX); // Smooth line

        // Plot individual mouse lines with dynamic thickness
        let mouseGroupedForPlot = d3.group(mouseAverages, d => d.MouseID);
        mouseGroupedForPlot.forEach((entries, mouseID) => {
            svg.append("path")
                .datum(entries)
                .attr("fill", "none")
                .attr("stroke", colorScale(mouseID))
                .attr("stroke-width", d => thicknessScale(d3.mean(entries, d => d.AvgActivity))) // Dynamic thickness
                .attr("d", line)
                .attr("opacity", 0.7);
        });

        // Plot overall average line in black with dynamic thickness
        svg.append("path")
            .datum(overallAverages)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", d => thicknessScale(d3.mean(overallAverages, d => d.AvgActivity))) // Dynamic thickness
            .attr("d", line);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(10))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Time of Day (Minutes)");

        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(10))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Average Temperature (°C)");

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 50}, 10)`);
        
        legend.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "black");
        legend.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .attr("fill", "black")
            .text("Overall Avg Temp");

        let mouseIDs = Array.from(mouseGroupedForPlot.keys());
        mouseIDs.forEach((mouseID, index) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", 30 + index * 20)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", colorScale(mouseID));

            legend.append("text")
                .attr("x", 30)
                .attr("y", 45 + index * 20)
                .attr("fill", "black")
                .text(`Mouse ${mouseID}`);
        });
    }

    // Function to create the interactive chart
    function createInteractiveChart(data) {
        const dropdownCycle = document.getElementById("cycleSelect");
        const dropdownType = document.getElementById("dataTypeSelect");
        const dropdownMouse = document.getElementById("mouseSelect");
        const includeAverage = document.getElementById("includeAverage");
        const chartContainer = d3.select("#interactiveChart");

        function updateChart() {
            chartContainer.html(""); // Clear previous chart

            const selectedCycle = dropdownCycle.value;
            const selectedType = dropdownType.value;
            const selectedMice = Array.from(dropdownMouse.selectedOptions).map(option => option.value);
            const showAverage = includeAverage.checked;

            let filteredData = data.filter(d => (selectedCycle === "On" ? d.Day % 4 === 2 : d.Day % 4 !== 2));

            if (selectedType === "Activity") {
                filteredData = filteredData.map(d => ({ ...d, Value: d.Activity }));
            } else if (selectedType === "Temperature") {
                filteredData = filteredData.map(d => ({ ...d, Value: d.Value }));
            }

            let groupedByMouse = d3.group(filteredData, d => d.MouseID);
            let finalData = [];

            groupedByMouse.forEach((entries, mouseID) => {
                if (selectedMice.includes(mouseID)) {
                    let avgData = d3.rollups(entries, v => d3.mean(v, d => d.Value), d => d.TimeOfDay)
                        .map(([TimeOfDay, AvgValue]) => ({ MouseID: mouseID, TimeOfDay, AvgValue }));
                    finalData.push(...avgData);
                }
            });

            if (showAverage) {
                let overallAvg = d3.rollups(finalData, v => d3.mean(v, d => d.AvgValue), d => d.TimeOfDay)
                    .map(([TimeOfDay, AvgValue]) => ({ MouseID: "Average", TimeOfDay, AvgValue }));
                finalData.push(...overallAvg);
            }

            const margin = { top: 50, right: 90, bottom: 80, left: 90 };
            const width = 800 - margin.left - margin.right;
            const height = 500 - margin.top - margin.bottom;

            const svg = chartContainer.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const xScale = d3.scaleLinear()
                .domain(d3.extent(finalData, d => d.TimeOfDay))
                .nice()
                .range([0, width]);

            const yScale = d3.scaleLinear()
                .domain(d3.extent(finalData, d => d.AvgValue))
                .nice()
                .range([height, 0]);

            const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

            let line = d3.line()
                .x(d => xScale(d.TimeOfDay))
                .y(d => yScale(d.AvgValue))
                .curve(d3.curveMonotoneX);

            let groupedForPlot = d3.group(finalData, d => d.MouseID);
            groupedForPlot.forEach((entries, mouseID) => {
                svg.append("path")
                    .datum(entries)
                    .attr("fill", "none")
                    .attr("stroke", mouseID === "Average" ? "black" : colorScale(mouseID))
                    .attr("stroke-width", mouseID === "Average" ? 3 : 2)
                    .attr("d", line);
            });

            // Add axes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale).ticks(10))
                .append("text")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .text("Time of Day (Minutes)");

            svg.append("g")
                .call(d3.axisLeft(yScale).ticks(10))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -60)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .text(selectedType === "Activity" ? "Average Activity Level" : "Average Temperature (°C)");

            // Add legend
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 50}, 10)`);

            legend.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "black");
            legend.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .attr("fill", "black")
                .text("Overall Avg");

            let mouseIDs = Array.from(groupedForPlot.keys()).filter(id => id !== "Average");
            mouseIDs.forEach((mouseID, index) => {
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", 30 + index * 20)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", colorScale(mouseID));

                legend.append("text")
                    .attr("x", 30)
                    .attr("y", 45 + index * 20)
                    .attr("fill", "black")
                    .text(`Mouse ${mouseID}`);
            });
        }

        dropdownCycle.addEventListener("change", updateChart);
        dropdownType.addEventListener("change", updateChart);
        dropdownMouse.addEventListener("change", updateChart);
        includeAverage.addEventListener("change", updateChart);

        updateChart();
    }
});
