
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, MixDOMProps, MixDOMRenderOutput } from "mix-dom";
// Common.
import { IconNames, appIcons } from "../../../common/index";


// - Component - //

export interface UIAppIconProps extends Omit<MixDOMProps<"span">, "class"> {
    iconName: IconNames;
    iconSize?: "small" | "normal" | "large";
}
export function UIAppIcon(props: UIAppIconProps): MixDOMRenderOutput {
    const { iconName, iconSize, className, ...passProps } = props;
    return <span {...passProps} className={classNames("ui-icon style-ui-icon flex-no-shrink", iconSize && ("size-" + iconSize), className)}>
        {appIcons[iconName]}
    </span>;
}
