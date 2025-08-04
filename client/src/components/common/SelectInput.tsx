import Select , { StylesConfig } from 'react-select';
import { useState } from "react";
import { useTheme } from "styled-components";

export interface ColourOption {
  readonly value: string;
  readonly label: string;
  readonly color?: string;
  readonly isFixed?: boolean;
  readonly isDisabled?: boolean;
}

export default function SelectInput({ options, placeholder, setInputValue, value }: { options: ColourOption[], placeholder: string, setInputValue: (value: string) => void, value: string }) {
  const theme = useTheme();
  const customStyles: StylesConfig<ColourOption, false> = {
    control: (provided) => ({
      ...provided,
      backgroundColor: theme.colors.cardBgColor,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.inputBorderColor}`,
      borderRadius: '4px',
      boxShadow: 'none',

    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      return {
        ...styles,
        backgroundColor: isDisabled
          ? undefined
          : isSelected
          ? theme.colors.selectActiveColor
          : isFocused
          ? theme.colors.selectActiveColor
          : theme.colors.cardBgColor,
        color: isDisabled
          ? '#ccc'
          : isSelected
          ? theme.colors.text
          : theme.colors.text,
        cursor: isDisabled ? 'not-allowed' : 'default',
  
        ':active': {
          ...styles[':active'],
          backgroundColor: !isDisabled
            ? isSelected
              ? theme.colors.selectActiveColor
              : theme.colors.selectActiveColor
            : theme.colors.selectActiveColor,
        },
      };
    },
    input: (styles) => ({ ...styles, ...{color: theme.colors.text} }),
    placeholder: (styles) => ({ ...styles, ...{color: theme.colors.text} }),
    singleValue: (styles) => ({ ...styles, ...{color: theme.colors.text} })
  };
  return (
    <div className="select-input">
      <Select<ColourOption>
        options={options}
        name="select-input"
        onChange={(e) => setInputValue(e?.value || '')}
        placeholder={placeholder}
        isSearchable={true}
        isClearable={true}
        isMulti={false}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: theme.colors.primary,
          },
        })}
        value={options.find(option => option.value === value) || null}
        styles={customStyles}
      />
    </div>
  );
}