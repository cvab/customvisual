"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
// import { sunburstData } from "./sampleDataSet";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import { VisualFormattingSettingsModel } from "./settings";
import * as d3 from 'd3';
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import { select, selectAll } from "d3";

import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { createTooltipServiceWrapper, ITooltipServiceWrapper, TooltipEventArgs } from "powerbi-visuals-utils-tooltiputils";

export class Visual implements IVisual {
  private target: HTMLElement;
  private formattingSettings: VisualFormattingSettingsModel;
  private formattingSettingsService: FormattingSettingsService;
  sunburstchartsvg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private selectionManager: ISelectionManager;
  public host: IVisualHost;
  private tooltipServiceWrapper: ITooltipServiceWrapper;

  constructor(options: VisualConstructorOptions) {
    
    this.formattingSettingsService = new FormattingSettingsService();
    this.host = options.host;
    this.selectionManager = this.host.createSelectionManager();
    this.target = options.element;
    this.sunburstchartsvg = d3.select(this.target).append("svg").classed("sunburstchartsvg", true);

    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      this.host.tooltipService,
      options.element
    );
  }

  public update(options: VisualUpdateOptions) {

    this.sunburstchartsvg.selectAll("*").remove();
    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
    const svgWidth = options.viewport.width;
    const canvasHeight = options.viewport.height;
    const radius = Math.min(svgWidth, canvasHeight) / 6;
    const dataView = options.dataViews[0].categorical;
    const valuess = dataView.values[0];
    const categories = dataView.categories;
    const parents = dataView.categories[0].values as string[];
    const children = dataView.categories[1].values as string[];
    const values = valuess.values as number[];

    const hierarchicalData = {
      name: "sunburst",
      children: [],
    };

    parents.forEach((parent, categoryIndex) => {

      const existingParent = hierarchicalData.children.find((item) => item.name === parent);
      const parentSelectionId = this.host.createSelectionIdBuilder().withCategory(categories[0], categoryIndex).createSelectionId();
      if (!existingParent) {
        const newParent = {
          name: parent,
          children: [],
          selectionId: parentSelectionId,
        };

        hierarchicalData.children.push(newParent);
        const filteredChildArray = children.filter((child, index) => `${parents[index]}` === `${parent}`);
        const filteredValuedArray = values.filter((value, index) => `${parents[index]}` === `${parent}`);
        filteredChildArray.forEach((el, index) => {

          const childIndex = children.findIndex((child) => child === el)
          const childSelectionId = this.host.createSelectionIdBuilder().withCategory(categories[1], childIndex).createSelectionId();
          const newChild = {
            name: el,
            value: filteredValuedArray[index],
            selectionId: childSelectionId,
          };
          newParent.children.push(newChild);
        });
      }
    });

    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, hierarchicalData.children.length + 1));
    // Compute the layout.
    const hierarchy = d3.hierarchy(hierarchicalData)
      .sum((d: any) => d.value)
      .sort((a, b) => b.value - a.value);
    //console.log()
    const root = d3.partition()
      .size([2 * Math.PI, hierarchy.height + 1])
      (hierarchy);
    root.each((d: any) => d.current = d);
    // Create the arc generator.
    const arc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d.y0 * radius)
      .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1));
    // Create the SVG container

    const svg = this.sunburstchartsvg
      .attr("viewBox", [-svgWidth / 2, -canvasHeight / 2, svgWidth, canvasHeight])
      .style("font-size", canvasHeight / 50)
      .style("cursor", "auto");

    const path = svg.append("g")
      .classed("slicegroup", true)
      .selectAll("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d: any) => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", (d: any) => arcVisible(d.current) ? (d.children ? 1 : 0.5) : 0)
      .attr("pointer-events", (d: any) => arcVisible(d.current) ? "auto" : "none")
      .attr("d", (d: any) => arc(d.current))
      .classed("slice", true)
      // path.filter((d: any) => d.children)
      // .classed("path-filter", true)
      // .on("click", clicked);
      .on("click", (d: any) => {

        const isParent = d.children ? true : false;
        const selectionIds = isParent ? d.data.children.map((el) => el.selectionId) : [d.data.selectionId]

        this.selectionManager.select(selectionIds).then((ids: ISelectionId[]) => {
          this.syncSelectionState(selectAll(".slice"), ids);
        });

      });

    // const format = d3.format(",d");
    // path.append("title")
    //   .classed("title-text", true)
    //   .text(d => `${d.ancestors().map((d: any) => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .style("font-size", d3.min([svgWidth, canvasHeight]) / 50 + "px")
      .attr("fill-opacity", (d: any) => +labelVisible(d.current))
      .attr("transform", (d: any) => labelTransform(d.current))
      .text((d: any) => d.data.name);

    const parent = svg.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
    // .on("click", clicked);

    // function clicked(p: { parent: any; x0: number; x1: number; depth: number; }) {
    //   parent.datum(p.parent || root);

    //   root.each((d: any) => d.target = {
    //     x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    //     x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    //     y0: Math.max(0, d.y0 - p.depth),
    //     y1: Math.max(0, d.y1 - p.depth)
    //   }
    //   );

    //   const t = svg.transition().duration(750);
    //   path.transition(t)
    //     .tween("{ children: hierarchicalData.categories }", (d: any) => {
    //       const i = d3.interpolate(d.current, d.target);
    //       return t => (d.current = i(t));
    //     })
    //     .filter(function (d: any) {
    //       return d3.select(this).attr("fill-opacity") !== null || arcVisible(d.target);
    //     })
    //     .attr("fill-opacity", (d: any) => arcVisible(d.target) ? (d.children ? 1 : 0.6) : 0)
    //     .attr("pointer-events", (d: any) => arcVisible(d.target) ? "auto" : "none")
    //     .attrTween("d", (d: any) => () => arc(d.current));

    //   label.filter(function (d) {
    //     // Explicitly specify the type of 'd' as any, or the appropriate type if known
    //     const hierarchyNode: any = d;
    //     return +(<SVGTextElement>this).getAttribute("fill-opacity") !== 0 || labelVisible(hierarchyNode.target);
    //   }).transition(t)
    //     .attr("fill-opacity", (d: any) => +labelVisible(d.target))
    //     .attrTween("transform", (d: any) => () => labelTransform(d.current));
    // }

    function arcVisible(d: { y1: number; y0: number; x1: number; x0: number; }) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d: { y1: number; y0: number; x1: number; x0: number; }) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d: { x0: any; x1: any; y0: any; y1: any; }) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    this.tooltipServiceWrapper.addTooltip(
      selectAll(".slice"),
      (tooltipEvent: TooltipEventArgs<number>) =>
        this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: any) => tooltipEvent.data.selectionId
    );
    
    // Add tooltip to label elements if needed
    this.tooltipServiceWrapper.addTooltip(
      label,
      (tooltipEvent: TooltipEventArgs<number>) => this.getTooltipData(tooltipEvent.data),
      (tooltipEvent: any) => tooltipEvent.data.selectionId
    );
    
  }

  private getTooltipData(hierarchicalData: any): VisualTooltipDataItem[] {
    const tooltipDataArray: VisualTooltipDataItem[] = [];
  
    // Example: Construct tooltip data for a parent element
    if (hierarchicalData && hierarchicalData.hierarchicalData) {
      tooltipDataArray.push({
        header: hierarchicalData.hierarchicalData.name, // Use the appropriate field for the header
        displayName: "Value",
        value: hierarchicalData.value.toString(), // Use the appropriate field for the value
      });
    }
  
    return tooltipDataArray;
  }
  
  private syncSelectionState(pathSelection: d3.Selection<d3.BaseType, unknown, HTMLElement, any>, selectionIds: ISelectionId[]) {
    if (!pathSelection || !selectionIds) {
      return;
    }
    if (selectionIds.length === 0) {
      pathSelection.style("opacity", 1);
      return;
    }
    pathSelection.each((hierarchicalData: any, i, e) => {
      const isParent = hierarchicalData?.children ? true : false;
      let isSelected = false;
  
      if (isParent) {
        // Check if any child selectionId is in the selectionIds array
        isSelected = hierarchicalData.data.children.some((child: { selectionId: ISelectionId }) =>
          selectionIds.some((selectedId: ISelectionId) => child.selectionId.includes(selectedId))
        );
      } else {
        // Check if the current element's selectionId is in the selectionIds array
        isSelected = selectionIds.some((selectedId: ISelectionId) =>
          hierarchicalData.data.selectionId.includes(selectedId)
        );
      }
  
      const opacity = isSelected ? 1 : 0.4;
      const currentBar = select(e[i]);
      currentBar.style("opacity", opacity);
    });
  }

  /*
   * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
   * This method is called once every time we open properties pane or when the user edit any format property. 
   */
  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
  }
}
