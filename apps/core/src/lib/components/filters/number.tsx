import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Column, IFilter, NumberFilter, OperationType } from '../../common';

import Select, { Option } from '../select/select';

import { useBeastStore } from '../../stores/beast-store';
import { useDebounce, useThrottle } from '../../utils/functions';

type Props = {
  column: Column;
  filters: Record<string, IFilter[]>;
  scrollContainer: HTMLDivElement | null;
};

const options = [
  { value: OperationType.NONE, label: <FormattedMessage id="filter.none" defaultMessage="None" /> },
  { value: OperationType.EQUAL, label: <FormattedMessage id="filter.equal" defaultMessage="Equal" /> },
  { value: OperationType.NOT_EQUAL, label: <FormattedMessage id="filter.notEqual" defaultMessage="Not Equal" /> },
  {
    value: OperationType.GREATER_THAN,
    label: <FormattedMessage id="filter.greaterThan" defaultMessage="Greater Than" />,
  },
  {
    value: OperationType.GREATER_THAN_OR_EQUAL,
    label: <FormattedMessage id="filter.greaterThanOrEqual" defaultMessage="Greater Than Or Equal" />,
  },
  { value: OperationType.LESS_THAN, label: <FormattedMessage id="filter.lessThan" defaultMessage="Less Than" /> },
  {
    value: OperationType.LESS_THAN_OR_EQUAL,
    label: <FormattedMessage id="filter.lessThanOrEqual" defaultMessage="Less Than Or Equal" />,
  },
];

export default function NumberFilter(props: Props) {
  const { column, filters, scrollContainer } = props;
  const [addFilter] = useBeastStore((state) => [state.addFilter]);
  const [activeOption, setActiveOption] = useState<Option | undefined>(undefined);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const throttle = useThrottle();
  const debounce = useDebounce();

  useEffect(() => {
    if (activeOption && inputValue) {
      debounce(() => throttle(() => addFilter(column.id, { op: activeOption.value, value: Number(inputValue) }), 300), 300);
    }
  }, [activeOption, inputValue, throttle]);

  useEffect(() => {
    if (filters && filters[column.id]?.length) {
      const { op, value } = (filters[column.id] as NumberFilter[])[0];
      const option = options.find(opt => opt.value === op);
      
      setActiveOption(option);
      setInputValue(value.toString());
    }
  }, [filters, column.id]);

  const handleSelectChange = (e: Option) => {
    if (!e || e.value === OperationType.NONE) {
      addFilter(column.id, null);
      setInputValue(undefined);
    }
    setActiveOption(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="bg-filter bg-filter__number">
      <div className="bg-filter__selector__container row middle">
        <Select
          label={<FormattedMessage id="filter.operation" />}
          activeOption={activeOption}
          options={[...options]}
          container={scrollContainer}
          onChange={handleSelectChange}
        />
        <input type="number" className="bg-filter__input" value={inputValue} onChange={handleInputChange} />
      </div>
    </div>
  );
}
