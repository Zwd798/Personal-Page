import React, { Component, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function BarChart(props) {

    const [data, setData] = useState(props.data);
    let canvas = useRef(null);
    
    // componentDidMount() {
    //     // const data = [ 2, 4, 2, 6, 8 ]
    //     // const data = FileAttachment("../../Data-Science/data/category-brands.csv").csv({typed: true})
    //     // this.drawBarChart(data);
    //     // this.drawRunningChart(this.state.data);
        
    // }
    const drawBarChart = (data) => { 
        const canvasHeight = 400
        const canvasWidth = 600
        const scale = 20
        
        const svgCanvas = d3.select(this.refs.canvas)
                            .append("svg")
                            .attr("width", canvasWidth)
                            .attr("height", canvasHeight)
                            .style("border", "1px solid black");
        
        svgCanvas.selectAll("rect")
            .data(data).enter()
                 .append("rect")
                 .attr("width", 40)
                 .attr("height", (datapoint) => datapoint * scale)
                 .attr("fill", "orange")
                 .attr("x", (datapoint, iteration) => iteration * 45)
                 .attr("y", (datapoint) => (canvasHeight - datapoint * scale) )
                
        svgCanvas.selectAll("text")
            .data(data).enter()
                .append("text")
                .attr("x", (dataPoint, i) => i * 45 + 10)
                .attr("y", (dataPoint, i) => canvasHeight - dataPoint * scale - 10)
                .text(dataPoint => dataPoint)
                
    }

    const drawRunningChart = (data) => {
      
      const svg = d3.select(canvas.current);

      const width = 500;
      // const height = 500;
      const duration = 250
      const barSize = 48
      const n = 12 // Number of bars we want to show
      let k = 10 // Controls the speed of the animating bars
      
      let districtNumbers = new Set(data.map(d => d.district));

      let margin = ({top: 16, right: 6, bottom: 6, left: 0})
      let height = margin.top + barSize * n + 1 + margin.bottom

      let x = d3.scaleLinear([0, 1], [margin.left, width - margin.right])
      let y = d3.scaleBand()
            .domain(d3.range(n + 1))
            .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
            .padding(0.1)

      // svg.attr("viewBox", [0, 0, width, height]);
      
      let dateValues = Array.from(d3.rollup(data, ([d]) => d.value, d => +new Date(d.date), d => d.district))
            .map(([date, data]) => [new Date(date), data])
            .sort(([a], [b]) => d3.ascending(a, b));
    
      let keyframes = (() => {
          const keyframes = [];
          let ka, a, kb, b;
          for ([[ka, a], [kb, b]] of d3.pairs(dateValues)) {
              for (let i = 0; i < k; ++i) {
                  const t = i / k;
                  keyframes.push([
                      new Date(ka * (1 - t) + kb * t),
                      rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
                  ]);
              }
          }
          keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
          return keyframes;
      })();
      console.log(keyframes);
      let nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.district);
      let prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
      let next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))

  
      let color = (() => {
        const scale = d3.scaleOrdinal(d3.schemeTableau10);
        if (data.some(d => d.category !== undefined)) {
          const categoryByName = new Map(data.map(d => [d.name, d.category]))
          scale.domain(Array.from(categoryByName.values()));
          return d => scale(categoryByName.get(d.name));
        }
        return d => scale(d.name);
      })();

        


        const updateBars = bars(svg);
        const updateAxis = axis(svg);
        const updateLabels = labels(svg);
        const updateTicker = ticker(svg);

        rank(name => dateValues[0][1].get(name));

        
        for (const keyframe of keyframes) {
            const transition = svg.transition()
                .duration(duration)
                .ease(d3.easeLinear);
        
            // Extract the top bar’s value.
            x.domain([0, keyframe[1][0].value]);
        
            updateAxis(keyframe, transition);
            updateBars(keyframe, transition);
            updateLabels(keyframe, transition);
            updateTicker(keyframe, transition);
            
            // await transition.end();
          }

        
        
        function rank(value) {
            const data = Array.from(districtNumbers, district => ({district, value: value(district)}));
            data.sort((a, b) => d3.descending(a.value, b.value));
            for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
            return data;
        }
        
        

        function bars(svg) {
            let bar = svg.append("g")
                .attr("fill-opacity", 0.6)
                .selectAll("rect");
            

            return ([date, data], transition) => bar = bar
                .data(data.slice(0, n), d => d.name)
                .join(
                enter => enter.append("rect")
                    .attr("fill", color)
                    .attr("height", y.bandwidth())
                    .attr("x", x(0))
                    .attr("y", d => y((prev.get(d) || d).rank))
                    .attr("width", d => x((prev.get(d) || d).value) - x(0)),
                update => update,
                exit => exit.transition(transition).remove()
                    .attr("y", d => y((next.get(d) || d).rank))
                    .attr("width", d => x((next.get(d) || d).value) - x(0))
                )
                .call(bar => bar.transition(transition)
                .attr("y", d => y(d.rank))
                .attr("width", d => x(d.value) - x(0)));
        }

        

        function labels(svg) {
            let label = svg.append("g")
                .style("font", "bold 12px var(--sans-serif)")
                .style("font-variant-numeric", "tabular-nums")
                .attr("text-anchor", "end")
              .selectAll("text");
          
            return ([date, data], transition) => label = label
              .data(data.slice(0, n), d => d.name)
              .join(
                enter => enter.append("text")
                  .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                  .attr("y", y.bandwidth() / 2)
                  .attr("x", -6)
                  .attr("dy", "-0.25em")
                  .text(d => d.name)
                  .call(text => text.append("tspan")
                    .attr("fill-opacity", 0.7)
                    .attr("font-weight", "normal")
                    .attr("x", -6)
                    .attr("dy", "1.15em")),
                update => update,
                exit => exit.transition(transition).remove()
                  .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
                  .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
              )
              .call(bar => bar.transition(transition)
                .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
                .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))))
          }

          function textTween(a, b) {
            const i = d3.interpolateNumber(a, b);
            return function(t) {
              this.textContent = formatNumber(i(t));
            };
          }

          let formatNumber = d3.format(",d")
          
          function axis(svg) {
            const g = svg.append("g")
                .attr("transform", `translate(0,${margin.top})`);
          
            const axis = d3.axisTop(x)
                .ticks(width / 160)
                .tickSizeOuter(0)
                .tickSizeInner(-barSize * (n + y.padding()));
          
            return (_, transition) => {
              g.transition(transition).call(axis);
              g.select(".tick:first-of-type text").remove();
              g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
              g.select(".domain").remove();
            };
          }
          
          let formatDate = d3.utcFormat("%Y")


          function ticker(svg) {
            let formatDate = d3.utcFormat("%Y")

            const now = svg.append("text")
                .style("font", `bold ${barSize}px var(--sans-serif)`)
                .style("font-variant-numeric", "tabular-nums")
                .attr("text-anchor", "end")
                .attr("x", width - 6)
                .attr("y", margin.top + barSize * (n - 0.45))
                .attr("dy", "0.32em")
                .text(formatDate(keyframes[0][0]));
          
            return ([date], transition) => {
              transition.end().then(() => now.text(formatDate(date)));
            };
          }
          
    }

    // useEffect(() => {

    // });

      drawRunningChart(data);
        return (
            
            <svg ref={canvas}></svg> 
        )
    
}
