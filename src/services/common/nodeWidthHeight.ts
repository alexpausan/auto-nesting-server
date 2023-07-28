type SizeResult = {
  readonly width: "fill" | number | null;
  readonly height: "fill" | number | null;
};

export const nodeSize = (
  node: SceneNode,
  optimizeLayout: boolean
): SizeResult => {
  const hasLayout =
    "layoutAlign" in node && node.parent && "layoutMode" in node.parent;

  if (!hasLayout) {
    return { width: node.width, height: node.height };
  }

  const nodeAuto =
    (optimizeLayout && "inferredAutoLayout" in node
      ? node.inferredAutoLayout
      : null) ?? node;

  if ("layoutMode" in nodeAuto && nodeAuto.layoutMode === "NONE") {
    return { width: node.width, height: node.height };
  }

  const parentLayoutMode =
    "layoutMode" in nodeAuto.parent
      ? nodeAuto.parent.layoutMode
      : "NONE";

  const layoutMode =
    nodeAuto.layoutMode === "NONE" ? parentLayoutMode : nodeAuto.layoutMode;

  const layoutGrow =
    "layoutGrow" in nodeAuto ? nodeAuto.layoutGrow : undefined;

  const layoutShrink =
    "layoutShrink" in nodeAuto ? nodeAuto.layoutShrink : undefined;

  const layoutFill =
    "layoutGrow" in nodeAuto || "layoutShrink" in nodeAuto
      ? "AUTO"
      : "NONE";

  const layoutAlign =
    "layoutAlign" in nodeAuto ? nodeAuto.layoutAlign : undefined;

  // Use type assertion to tell TypeScript that the value is an object with horizontal and vertical properties
  const constraints = "constraints" in nodeAuto
    ? {
        horizontal:
          ("constraints" in nodeAuto && "horizontal" in nodeAuto.constraints)
            ? nodeAuto.constraints.horizontal === "STRETCH"
              ? "SCALE"
              : nodeAuto.constraints.horizontal
            : undefined,
        vertical:
          ("constraints" in nodeAuto && "vertical" in nodeAuto.constraints)
            ? nodeAuto.constraints.vertical === "STRETCH"
              ? "SCALE"
              : nodeAuto.constraints.vertical
            : undefined,
      }
    : undefined;

  const autoLayout = nodeAuto as { layoutMode: string };

  return {
    width: autoLayout.layoutMode === "HORIZONTAL" ? "fill" : node.width,
    height: autoLayout.layoutMode === "VERTICAL" ? "fill" : node.height,
  };
};