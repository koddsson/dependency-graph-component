import {
  zoom,
  create,
  drag as d3Drag,
  forceSimulation,
  forceLink,
  forceCollide,
  forceX,
  forceY,
} from "d3";
import { forceManyBodyReuse } from "d3-force-reuse";

const drag = (simulation) => {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;

    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

export class DependencyGraph extends HTMLElement {
  // #observer = new MutationObserver((mutationList) => {
  //   for (const mutation of mutationList) {
  //     if (mutation.type === "childList") {
  //       this.#render();
  //     }
  //   }
  // });

  connectedCallback() {
    //const json = this.querySelector('script[type="application/json"]');
    //this.#observer.observe(json, { childList: true, subtree: true });
    this.#render();
  }

  #render() {
    this.querySelectorAll("svg").forEach((x) => x.remove());

    // Specify the dimensions of the chart.
    const width = window.innerWidth;
    const height = window.innerHeight;

    const data = JSON.parse(
      this.querySelector('script[type="application/json"]').textContent,
    );

    const links = data.links.map((d) => Object.create(d));
    const nodes = data.nodes.map((d) => Object.create(d));

    // Create a simulation with several forces.
    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", forceManyBodyReuse().strength(-100))
      .force("collide", forceCollide().radius(9))
      .force("x", forceX())
      .force("y", forceY());

    const svg = create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const zoomContainer = svg.append("g"); // Create a group to hold the graph

    const zoomer = zoom().on("zoom", (event) => {
      zoomContainer.attr("transform", event.transform);
    });

    svg.call(zoomer);

    const link = zoomContainer
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = zoomContainer
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .call(d3Drag(simulation));

    node
      .append("circle")
      .attr("r", 5)
      .attr("fill", (d) => d.group);

    node
      .append("text")
      .text(function (d) {
        return d.id;
      })
      .style("fill", "#000")
      .style("font-size", "12px")
      .attr("x", 6)
      .attr("y", 3);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    // invalidation.then(() => simulation.stop());
    this.appendChild(svg.node());
  }
}
