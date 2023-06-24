const data = {
  nodes: [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
    { id: 'e', name: 'E' },
    { id: 'f', name: 'F' },
    { id: 'g', name: 'G' },
  ],

  // Format: { source: nodeId, target: nodeId, type: String }
  links: [],
}

const LINK_TYPES = {
  'Useful': '#b03d17',
  'Important': '#b8f27a',
  'Necessary': '#32a852',
  'Logically Connected': '#110dde',
  'Generalization': '#00f4fc',
  'Synonym': '#bd00fc',
}

const NODE_HEIGHT = 100;
const NODE_WIDTH = 100;
const LINK_WIDTH = 8;
const COLOR_CIRCLE_RADIUS = 20;

const svg = d3.select('#graph');

let selectedLinkType = 'Useful';

svg.append('g').attr('id', 'links');
svg.append('g').attr('id', 'startNodes');
svg.append('g').attr('id', 'endNodes');
svg.append('g').attr('id', 'linkTypes');

const eventPositionToNode = (event) => {
  const { x, y } = event;
  const nodes = svg.selectAll('.node').nodes();
  const node = nodes.find((node) => {
    let { x: nodeX, y: nodeY } = node.getBoundingClientRect();
    nodeX -= svg.node().getBoundingClientRect().x;
    nodeY -= svg.node().getBoundingClientRect().y;
    return x >= nodeX && x <= nodeX + NODE_WIDTH && y >= nodeY && y <= nodeY + NODE_HEIGHT;
  });
  return node;
};

const updateLinks = () => {
  svg
    .select('#links')
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('x1', (d) => {
      const node = d3.select(`#startNode-${d.source}`);
      let { x, y } = node.node().getBoundingClientRect();
      x -= svg.node().getBoundingClientRect().x;
      return x + NODE_WIDTH / 2;
    }
    )
    .attr('y1', (d) => {
      const node = d3.select(`#startNode-${d.source}`);
      let { x, y } = node.node().getBoundingClientRect();
      y -= svg.node().getBoundingClientRect().y;
      return y + NODE_HEIGHT / 2;
    }
    )
    .attr('x2', (d) => {
      const node = d3.select(`#endNode-${d.target}`);
      let { x, y } = node.node().getBoundingClientRect();
      x -= svg.node().getBoundingClientRect().x;
      return x + NODE_WIDTH / 2;
    }
    )
    .attr('y2', (d) => {
      const node = d3.select(`#endNode-${d.target}`);
      let { x, y } = node.node().getBoundingClientRect();
      y -= svg.node().getBoundingClientRect().y;
      return y + NODE_HEIGHT / 2;
    }
    )
    .attr("stroke-width", LINK_WIDTH)
    .attr('stroke', (d) => LINK_TYPES[d.type])
    .on('click', (_, d) => {
      // Remove the link
      const index = data.links.findIndex((link) => link.source === d.source && link.target === d.target);
      data.links.splice(index, 1);
      updateLinks();
    });
};


const drag_handler = d3.drag()
  .on("start", (event) => {
    // Add a temporary arrow and let it follow the mouse
    svg.append("line")
      .attr("x1", event.x)
      .attr("y1", event.y)
      .attr("x2", event.x)
      .attr("y2", event.y)
      .attr("stroke-width", LINK_WIDTH)
      .attr('stroke', LINK_TYPES[selectedLinkType])
      .attr("marker-end", "url(#arrowhead)")
      .attr("id", "temp-arrow");

  })
  .on("drag", (event) => {
    svg.select("#temp-arrow")
      .attr("x2", event.x)
      .attr("y2", event.y);
  })
  .on("end", (event) => {
    // 1. Track the node that the arrow is pointing to, if any, and add it to the links
    // 2. Remove the temporary arrow
    // 3. Redraw the links
    const target = eventPositionToNode(event);
    if (target) {
      const d3Target = d3.select(target);

      // Remove existing link between the two nodes if any.
      const existingLink = data.links.findIndex((link) => {
        link.source === event.subject.id && link.target === d3Target.datum().id;
      })
      if (existingLink !== -1) {
        data.links.splice(existingLink, 1);
      }

      data.links.push({
        source: event.subject.id,
        target: d3Target.datum().id,
        type: selectedLinkType,
      });
    }
    svg.select("#temp-arrow").remove();
    updateLinks();
  });


const startNodes = svg
  .select('#startNodes')
  .selectAll('g')
  .data(data.nodes, d => d.id)
  .join("g")
  .attr('id', d => `startNode-${d.id}`)
  .attr('class', 'node')
  .attr('transform', (_d, i) => `translate(100, ${i * (NODE_HEIGHT + 10)})`)
  .attr('style', 'cursor: pointer;')
  .call((node) => node
    .append('rect')
    .attr('width', NODE_WIDTH)
    .attr('height', NODE_HEIGHT)
    .attr('fill', 'red')
  )
  .call((node) => node
    .append('text')
    .attr('style', 'fill: white; font-size: 30px;')
    .attr('dy', 60)
    .attr('dx', 40)
    .text(d => d.name)
  )
  .call(drag_handler);


const endNodes = svg
  .select('#endNodes')
  .selectAll('g')
  .data(data.nodes, d => d.id)
  .join("g")
  .attr('id', d => `endNode-${d.id}`)
  .attr('class', 'node')
  .attr('transform', (_d, i) => `translate(500, ${i * (NODE_HEIGHT + 10)})`)
  .call((node) => node
    .append('rect')
    .attr('width', NODE_WIDTH)
    .attr('height', NODE_HEIGHT)
    .attr('fill', 'blue')
  )
  .call((node) => node
    .append('text')
    .attr('style', 'fill: white; font-size: 30px;')
    .attr('dy', 60)
    .attr('dx', 40)
    .text(d => d.name)
  );


const linkTypes = svg
  .select('#linkTypes')
  .selectAll('g')
  .data(Object.keys(LINK_TYPES))
  .join("g")
  .attr('id', d => d)
  .call((node) => node
    .append('circle')
    .attr('cx', (_d, i) => 250 + (i * (COLOR_CIRCLE_RADIUS * 2 + 10)))
    .attr('cy', 800)
    .attr('r', COLOR_CIRCLE_RADIUS)
    .attr('fill', (d) => LINK_TYPES[d])
    .attr('stroke-width', 5)
  )
  .on('click', (event, d) => {
    console.log('clicked', d);
    d3.select('#linkTypes').selectAll('circle').attr('stroke', 'none');
    selectedLinkType = d;
    d3.select(event.target).attr('stroke', 'red');
  });


d3.select('#' + selectedLinkType).attr('stroke', 'red');