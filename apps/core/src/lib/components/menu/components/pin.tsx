import { Column, MenuHorizontalPosition, PinType } from "../../../common";

import { FormattedMessage } from "react-intl";
import { CheckIcon, ChevronRightIcon } from "@radix-ui/react-icons";

import { useBeastStore } from "../../../stores/beast-store";
import { SectionsEnum } from "../menu-layer";
import { PropsWithMouseEnter } from "./sections";

import cn from "classnames";

export default function PinSection({
  column,
  horizontal,
  activeSection,
  onClose,
  onMouseEnter
}: PropsWithMouseEnter<{
  column: Column;
  horizontal: MenuHorizontalPosition;
  activeSection: SectionsEnum | undefined;
  onClose: () => void;
}>) {
  const [pinColumn] = useBeastStore((state) => [state.pinColumn]);
  
  if (!column.menu?.pin || column.parent) {
    return null;
  }
  
  const handlePinColumn = (pinType: PinType) => () => {
    pinColumn(column.id, column.pinned === pinType ? PinType.NONE : pinType);
    onClose();
  };


  const renderSubmenu = () => {
    if (activeSection !== SectionsEnum.PIN) {
      return null;
    }

    return (
      <div className={cn('bg-menu__item__submenu column', horizontal)}>
        <div className="bg-menu__item row middle between" onClick={handlePinColumn(PinType.LEFT)}>
          <FormattedMessage id="menu.pin.left" defaultMessage="Pin left" />
          {column.pinned === PinType.LEFT ? <CheckIcon /> : null}
        </div>
        <div className="bg-menu__separator--transparent" />
        <div className="bg-menu__item row middle between" onClick={handlePinColumn(PinType.RIGHT)}>
          <FormattedMessage id="menu.pin.right" defaultMessage="Pin right" />
          {column.pinned === PinType.RIGHT ? <CheckIcon /> : null}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-menu__content column config" onMouseEnter={onMouseEnter}>
      <div className="bg-menu__item bg-menu__item--with-submenu row middle between" >
        <div className="row middle left">
          <div className="bg-menu__item__filler" />
          <FormattedMessage id="menu.pin.pin" defaultMessage="Pin" />
        </div>
        <ChevronRightIcon />
      </div>
      {renderSubmenu()}
    </div>
  );
}

