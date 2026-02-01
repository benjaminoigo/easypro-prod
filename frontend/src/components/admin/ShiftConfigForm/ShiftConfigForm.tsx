import React from 'react';
import { useForm } from 'react-hook-form';
import { Clock, FileText, Save, X } from 'lucide-react';
import './ShiftConfigForm.css';

export interface ShiftConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  maxPagesPerShift: number;
  autoCreateShifts: boolean;
  timezone: string;
}

export interface ShiftConfigFormProps {
  initialValues?: Partial<ShiftConfig>;
  onSubmit: (values: ShiftConfig) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const defaultValues: ShiftConfig = {
  startHour: 0,
  startMinute: 0,
  endHour: 23,
  endMinute: 59,
  maxPagesPerShift: 50,
  autoCreateShifts: true,
  timezone: 'UTC',
};

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

const ShiftConfigForm: React.FC<ShiftConfigFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ShiftConfig>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const autoCreate = watch('autoCreateShifts');

  const handleFormSubmit = async (data: ShiftConfig) => {
    await onSubmit(data);
  };

  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <form 
      className={`shift-config-form ${className}`} 
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="form-section">
        <h3 className="section-title">
          <Clock className="section-icon" />
          Shift Schedule
        </h3>

        <div className="time-inputs">
          <div className="time-group">
            <label>Start Time</label>
            <div className="time-selects">
              <select {...register('startHour', { valueAsNumber: true })}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="time-separator">:</span>
              <select {...register('startMinute', { valueAsNumber: true })}>
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="time-group">
            <label>End Time</label>
            <div className="time-selects">
              <select {...register('endHour', { valueAsNumber: true })}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className="time-separator">:</span>
              <select {...register('endMinute', { valueAsNumber: true })}>
                {[0, 15, 30, 45, 59].map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="timezone">Timezone</label>
          <select 
            id="timezone"
            {...register('timezone')}
            className="form-select"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">
          <FileText className="section-icon" />
          Shift Limits
        </h3>

        <div className="form-group">
          <label htmlFor="maxPagesPerShift">Max Pages Per Shift</label>
          <input
            id="maxPagesPerShift"
            type="number"
            min="1"
            max="500"
            {...register('maxPagesPerShift', {
              valueAsNumber: true,
              required: 'Max pages is required',
              min: { value: 1, message: 'Must be at least 1' },
              max: { value: 500, message: 'Cannot exceed 500' },
            })}
            className={`form-input ${errors.maxPagesPerShift ? 'error' : ''}`}
          />
          {errors.maxPagesPerShift && (
            <span className="error-message">{errors.maxPagesPerShift.message}</span>
          )}
          <span className="input-hint">
            Maximum number of pages a writer can complete per shift
          </span>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Automation</h3>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              {...register('autoCreateShifts')}
            />
            <span className="checkbox-text">
              Automatically create daily shifts
            </span>
          </label>
          <span className="input-hint">
            {autoCreate 
              ? 'Shifts will be automatically created at the start time each day'
              : 'You will need to manually create shifts'
            }
          </span>
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X />
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          <Save />
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
};

export default ShiftConfigForm;
