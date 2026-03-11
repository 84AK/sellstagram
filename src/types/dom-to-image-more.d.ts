declare module "dom-to-image-more" {
    interface Options {
        scale?: number;
        useCORS?: boolean;
        bgcolor?: string | null;
        width?: number;
        height?: number;
        filter?: (node: Node) => boolean;
        style?: Record<string, string>;
    }
    const domtoimage: {
        toPng(node: Node, options?: Options): Promise<string>;
        toBlob(node: Node, options?: Options): Promise<Blob>;
        toJpeg(node: Node, options?: Options): Promise<string>;
        toSvg(node: Node, options?: Options): Promise<string>;
    };
    export default domtoimage;
}
