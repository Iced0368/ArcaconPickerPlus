import { createPortal } from "react-dom";
import PortalAhead from "./createAheadPortal";

export function PickerAheadPortalList({ pickers, getTarget, getKey, getPortalProps, render }) {
  return (
    <>
      {pickers.map((picker, index) => {
        const target = getTarget(picker);
        if (!target) return null;

        const portalProps = getPortalProps ? getPortalProps(picker) : {};
        const key = getKey ? getKey(picker, index) : `picker-ahead-portal-${picker.uid || index}`;

        return (
          <PortalAhead key={key} target={target} {...portalProps}>
            {render(picker, index)}
          </PortalAhead>
        );
      })}
    </>
  );
}

export function PickerPortalList({ pickers, getTarget, getKey, render }) {
  return (
    <>
      {pickers.map((picker, index) => {
        const target = getTarget(picker);
        if (!target) return null;

        const key = getKey ? getKey(picker, index) : `picker-portal-${picker.uid || index}`;
        return createPortal(render(picker, index), target, key);
      })}
    </>
  );
}
