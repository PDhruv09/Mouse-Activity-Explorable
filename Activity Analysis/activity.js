document.addEventListener("DOMContentLoaded", function () {
    // File paths
    const maleDataPath = "../assets/data/Mouse_Data_Student_Copy Male Act.csv";
    const femaleDataPath = "../assets/data/Mouse_Data_Student_Copy Fem Act.csv";

    // Function to load and process CSV
    function loadAndProcessCSV(filePath, gender) {
        return d3.csv(filePath).then(data => {
            let formattedData = [];
            let mouseIDs = Object.keys(data[0]); // Extract mouse IDs (m1, m2, ..., f13)

            data.forEach((row, minute) => {
                let day = Math.floor(minute / 1440) + 1; // Convert minute into Day (1-14)
                let timeOfDay = minute % 1440; // Convert into Minutes within a day (0-1439)

                mouseIDs.forEach(mouseID => {
                    formattedData.push({
                        MouseID: mouseID,
                        Day: day,
                        TimeOfDay: timeOfDay,
                        Activity: +row[mouseID] || 0, // Convert activity to number, default to 0 if NaN
                        Gender: gender
                    });
                });
            });

            return formattedData;
        });
    }

    // Load both datasets
    Promise.all([loadAndProcessCSV(maleDataPath, "Male"), loadAndProcessCSV(femaleDataPath, "Female")]).then(([maleMice, femaleMice]) => {
        const allData = [...maleMice, ...femaleMice];

        // Set dimensions & margins
        const margin = { top: 50, right: 150, bottom: 60, left: 70 };
        const width = 1000 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        /** ==========================
         *  STATIC CHART 1: AVG MALE vs FEMALE ACTIVITY
         *  ========================== 
        */
        const avgActivityByGender = [
            { Gender: "Male", AvgActivity: d3.mean(maleMice, d => d.Activity) || 0 },
            { Gender: "Female", AvgActivity: d3.mean(femaleMice, d => d.Activity) || 0 }
        ];

        const svgStatic1 = d3.select("#staticChart1").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale1 = d3.scaleBand().domain(avgActivityByGender.map(d => d.Gender)).range([0, width]).padding(0.4);
        const yScale1 = d3.scaleLinear().domain([0, d3.max(avgActivityByGender, d => d.AvgActivity) || 1]).range([height, 0]);

        svgStatic1.selectAll(".bar").data(avgActivityByGender).enter()
            .append("rect")
            .attr("x", d => xScale1(d.Gender))
            .attr("y", d => yScale1(d.AvgActivity))
            .attr("width", xScale1.bandwidth())
            .attr("height", d => height - yScale1(d.AvgActivity))
            .attr("fill", d => d.Gender === "Male" ? "#4682B4" : "#FF69B4");

        svgStatic1.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale1));
        svgStatic1.append("g").call(d3.axisLeft(yScale1));
        svgStatic1.append("text").attr("x", width / 2).attr("y", height + 40).attr("text-anchor", "middle").text("Gender");
        svgStatic1.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -50).attr("text-anchor", "middle").text("Avg Activity Level");

        /** ==========================
         *  STATIC CHART 2 & 3: MALE & FEMALE MICE ACTIVITY OVER TIME WITH AVERAGE
         *  ========================== 
        */
        function createLineChartWithAverage(svgSelector, data, colorScale, chartTitle) {
            const svg = d3.select(svgSelector).append("svg")
                .attr("width", width + margin.left + margin.right + 100)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
        
            const xScale = d3.scaleLinear().domain([0, 1440]).range([0, width]);
            
            // Compute average activity per mouse per time
            const mouseTimeAvg = d3.rollups(
                data,
                v => d3.mean(v, d => d.Activity),
                d => d.MouseID,
                d => d.TimeOfDay
            );
        
            const mouseAvgData = mouseTimeAvg.map(([mouseID, values]) => ({
                mouseID,
                values: values.map(([time, avg]) => ({ TimeOfDay: time, AvgActivity: avg }))
                                .sort((a, b) => a.TimeOfDay - b.TimeOfDay)
            }));
        
            // Calculate the global average activity across all mice at each time
            const globalAvgMap = d3.rollup(
                data,
                v => d3.mean(v, d => d.Activity),
                d => d.TimeOfDay
            );
        
            const globalAvgData = Array.from(globalAvgMap, ([TimeOfDay, AvgActivity]) => ({
                TimeOfDay: +TimeOfDay,
                AvgActivity
            })).sort((a, b) => a.TimeOfDay - b.TimeOfDay);
        
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.Activity) || 1])
                .range([height, 0]);
        
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale));
        
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 10)
                .attr("text-anchor", "middle")
                .text("Time of Day (Minutes)");
        
            svg.append("g").call(d3.axisLeft(yScale));
        
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 15)
                .attr("text-anchor", "middle")
                .text("Average Activity Level");
            
            svg.append("text")  
                .attr("x", width)
                .attr("y", - 10)
                .attr("fill", "black")
                .attr("font-size", "14px")
                .text("Legend");
        
            // Plot average lines for individual mice
            mouseAvgData.forEach(mouse => {
                svg.append("path")
                    .datum(mouse.values)
                    .attr("fill", "none")
                    .attr("stroke", colorScale(mouse.mouseID))
                    .attr("stroke-width", 1.5)
                    .attr("opacity", 0.6)
                    .attr("d", d3.line()
                        .x(d => xScale(d.TimeOfDay))
                        .y(d => yScale(d.AvgActivity))
                    );
            });
        
            // Plot overall average activity line
            svg.append("path")
                .datum(globalAvgData)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 2")
                .attr("d", d3.line()
                    .x(d => xScale(d.TimeOfDay))
                    .y(d => yScale(d.AvgActivity))
                );
        
            // Chart title
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("class", "chart-title")
                .text(chartTitle);
        
            // Legend creation
            const legend = svg.selectAll(".legend")
                .data([...mouseAvgData.map(d => d.mouseID), "Overall Average"])
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", (d, i) => `translate(${width + 20}, ${i * 20})`);
        
            legend.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", d => d === "Overall Average" ? "black" : colorScale(d))
                .style("opacity", d => d === "Overall Average" ? 1 : 0.6)
                .style("stroke", d => d === "Overall Average" ? "black" : "none")
                .style("stroke-dasharray", d => d === "Overall Average" ? "4 2" : "none");
        
            legend.append("text")
                .attr("x", 24)
                .attr("y", 9)
                .attr("dy", "0.35em")
                .text(d => d);
        }
        
        // Call function for female and male mice
        createLineChartWithAverage("#staticChart2", femaleMice, d3.scaleOrdinal(d3.schemeCategory10), "Female Mice Average Activity Over Time");
        createLineChartWithAverage("#staticChart3", maleMice, d3.scaleOrdinal(d3.schemeCategory10), "Male Mice Average Activity Over Time");

        /** ==========================
         *  INTERACTIVE CHART
         *  ========================== */
        // Select SVG for interactive chart
        const svgInteractive = d3.select("#interactiveChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

        const genderDropdown = d3.select("#genderSelector");
        const mouseDropdown = d3.select("#mouseSelector");
        const showSelectedAvgCheckbox = d3.select("#includeSelectedAverage");
        const showAllAvgCheckbox = d3.select("#includeAllAverage");

        // Initialize mouse dropdown based on gender selection
        function updateMouseDropdown() {
        const selectedGender = genderDropdown.node().value;
        const miceList = selectedGender === "male"
            ? [...new Set(maleMice.map(d => d.MouseID))]
            : [...new Set(femaleMice.map(d => d.MouseID))];

        mouseDropdown.selectAll("option").remove();
        mouseDropdown.selectAll("option")
            .data(miceList).enter()
            .append("option").attr("value", d => d).text(d => d);

        // Allow multiple selection
        mouseDropdown.attr("multiple", true);
        }

        // Update Interactive Chart Function
        function updateInteractiveChart() {
        const selectedGender = genderDropdown.node().value;
        const selectedData = selectedGender === "male" ? maleMice : femaleMice;
        const selectedMice = Array.from(mouseDropdown.node().selectedOptions, option => option.value);

        // Clear previous lines and axes
        svgInteractive.selectAll("*").remove();

        // X and Y scales
        const xScale1 = d3.scaleLinear().domain([0, 1440]).range([0, width]);
        const yScale1 = d3.scaleLinear()
            .domain([0, d3.max(selectedData, d => d.Activity) || 1])
            .range([height, 0]);

        // X-axis
        svgInteractive.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale1));

        // X-axis label
        svgInteractive.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text("Time of Day (Minutes)");

        // Y-axis
        svgInteractive.append("g")
            .call(d3.axisLeft(yScale1));

        // Y-axis label
        svgInteractive.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .text("Activity Level");
        
        svgInteractive.append("text")  
            .attr("x", width-100)
            .attr("y", - 10)
            .attr("fill", "black")
            .attr("font-size", "14px")
            .text("Legend");

        // Plot average line per selected mouse
        selectedMice.forEach((mouseID, idx) => {
            const mouseData = selectedData.filter(d => d.MouseID === mouseID);
            const mouseAvgMap = d3.rollup(mouseData, v => d3.mean(v, d => d.Activity), d => d.TimeOfDay);

            const mouseAvgData = Array.from(mouseAvgMap, ([TimeOfDay, AvgActivity]) => ({
                TimeOfDay: +TimeOfDay,
                AvgActivity
            })).sort((a, b) => a.TimeOfDay - b.TimeOfDay);

            svgInteractive.append("path")
                .datum(mouseAvgData)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[idx % 10])
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => xScale1(d.TimeOfDay))
                    .y(d => yScale1(d.AvgActivity))
                );
        });

        // Average line for Selected Mice (Solid Black or Grey)
        if (showSelectedAvgCheckbox.property("checked") && selectedMice.length > 0) {
            const selectedMiceData = selectedData.filter(d => selectedMice.includes(d.MouseID));
            const selectedAvgMap = d3.rollup(selectedMiceData, v => d3.mean(v, d => d.Activity), d => d.TimeOfDay);

            const selectedAvgData = Array.from(selectedAvgMap, ([TimeOfDay, AvgActivity]) => ({
                TimeOfDay: +TimeOfDay,
                AvgActivity
            })).sort((a, b) => a.TimeOfDay - b.TimeOfDay);

            svgInteractive.append("path")
                .datum(selectedAvgData)
                .attr("fill", "none")
                .attr("stroke", "grey") // Changed to grey solid line
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => xScale1(d.TimeOfDay))
                    .y(d => yScale1(d.AvgActivity))
                );
        }

        // Average line for All Mice (Black dotted)
        if (showAllAvgCheckbox.property("checked")) {
            const overallAvgMap = d3.rollup(selectedData, v => d3.mean(v, d => d.Activity), d => d.TimeOfDay);

            const overallAvgData = Array.from(overallAvgMap, ([TimeOfDay, AvgActivity]) => ({
                TimeOfDay: +TimeOfDay,
                AvgActivity
            })).sort((a, b) => a.TimeOfDay - b.TimeOfDay);

            svgInteractive.append("path")
                .datum(overallAvgData)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 2")
                .attr("d", d3.line()
                    .x(d => xScale1(d.TimeOfDay))
                    .y(d => yScale1(d.AvgActivity))
                );
        }

        // Add Legends
        const legendData = selectedMice.concat(showSelectedAvgCheckbox.property("checked") ? ["Selected Mice Avg"] : [],
            showAllAvgCheckbox.property("checked") ? ["All Mice Avg"] : []);

        svgInteractive.selectAll(".legend")
            .data(legendData)
            .enter().append("text")
            .attr("x", width - 100)
            .attr("y", (_, i) => 20 + i * 20)
            .attr("fill", (_, i) => i < selectedMice.length ? d3.schemeCategory10[i % 10] : (legendData[i] === "Selected Mice Avg" ? "grey" : "black"))
            .text(d => d);
        }

        // Attach events
        genderDropdown.on("change", () => { updateMouseDropdown(); updateInteractiveChart(); });
        mouseDropdown.on("change", updateInteractiveChart);
        showSelectedAvgCheckbox.on("change", updateInteractiveChart);
        showAllAvgCheckbox.on("change", updateInteractiveChart);

        // Initial population
        updateMouseDropdown();
        updateInteractiveChart();
    }).catch(err => console.error("CSV load error:", err));
});
