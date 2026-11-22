import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import type { SelectAllState } from '../model/selection';

type SelectAllCheckboxProps = {
  state: SelectAllState;
  onToggle: () => void;
  disabled?: boolean;
};

export function SelectAllCheckbox({ state, onToggle, disabled = false }: SelectAllCheckboxProps) {
  return (
    <FormControlLabel
      label="Выбрать все"
      disabled={disabled}
      control={
        <Checkbox checked={state === 'all'} indeterminate={state === 'some'} onChange={onToggle} />
      }
    />
  );
}
