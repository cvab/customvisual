import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import * as d3 from 'd3';
export declare class Visual implements IVisual {
    private target;
    private formattingSettings;
    private formattingSettingsService;
    sunburstchartsvg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
