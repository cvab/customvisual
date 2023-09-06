import { Visual } from "../../src/visual";
import powerbiVisualsApi from "powerbi-visuals-api";
import IVisualPlugin = powerbiVisualsApi.visuals.plugins.IVisualPlugin;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import DialogConstructorOptions = powerbiVisualsApi.extensibility.visual.DialogConstructorOptions;
var powerbiKey: any = "powerbi";
var powerbi: any = window[powerbiKey];
var customvisualD84FDC3DFD3F4CC383619D0D27C03B7E_DEBUG: IVisualPlugin = {
    name: 'customvisualD84FDC3DFD3F4CC383619D0D27C03B7E_DEBUG',
    displayName: 'customvisual',
    class: 'Visual',
    apiVersion: '5.1.0',
    create: (options?: VisualConstructorOptions) => {
        if (Visual) {
            return new Visual(options);
        }
        throw 'Visual instance not found';
    },
    createModalDialog: (dialogId: string, options: DialogConstructorOptions, initialState: object) => {
        const dialogRegistry = (<any>globalThis).dialogRegistry;
        if (dialogId in dialogRegistry) {
            new dialogRegistry[dialogId](options, initialState);
        }
    },
    custom: true
};
if (typeof powerbi !== "undefined") {
    powerbi.visuals = powerbi.visuals || {};
    powerbi.visuals.plugins = powerbi.visuals.plugins || {};
    powerbi.visuals.plugins["customvisualD84FDC3DFD3F4CC383619D0D27C03B7E_DEBUG"] = customvisualD84FDC3DFD3F4CC383619D0D27C03B7E_DEBUG;
}
export default customvisualD84FDC3DFD3F4CC383619D0D27C03B7E_DEBUG;