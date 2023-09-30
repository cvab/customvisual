import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import * as d3 from 'd3';
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
export declare class Visual implements IVisual {
    private target;
    private formattingSettings;
    private formattingSettingsService;
    sunburstchartsvg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private selectionManager;
    host: IVisualHost;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private syncSelectionState;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
