

import { Listbox } from '@headlessui/react'

export default function Select({
  value,
  onChange,
  options
}: {
  value: string | number,
  onChange: (value: string | number) => unknown,
  options: {
    label: string
    value: string | number,
  }[]
}) {
  return (
    <Listbox value={value} by="id" onChange={opt => onChange(opt.value)} as={'div'} className={'w-full relative mb-1'}>
      <Listbox.Button as='div' className="w-full">
        <div className='border p-2 rounded-md text-left w-full'>
          {options.find(opt => opt.value === value)?.label || 'Seleccionar ...'}
        </div>
      </Listbox.Button>
      <Listbox.Options>
        <div className='mt-1 shadow-md border rounded-md max-h-60 overflow-y-scroll right-0'>
          {options.map((option) => (
            <Listbox.Option key={option.value} value={option}>
              <div className='cursor-pointer py-1 px-3 hover:bg-gray-200'>
                {option.label}
              </div>
            </Listbox.Option>
          ))}
        </div>
      </Listbox.Options>
    </Listbox>
  )
}

