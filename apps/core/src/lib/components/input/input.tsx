import { Cross2Icon } from "@radix-ui/react-icons";
import { useState } from "react";

import './input.scss';

type Props = {
  placeholder: string;
  className: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export default function Input(props: Props) {
  const [value, setValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange(e);
  }

  const clearInput = () => {
    setValue('');
    props.onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  }
  
  return (
      <div className="row middle between bg-input__container">
        <input
          type="text"
          autoFocus
          value={value}
          placeholder={props.placeholder}
          className={props.className}
          onChange={handleInputChange}
        />
        {value && <Cross2Icon onClick={clearInput} />}
      </div>
  )
}
