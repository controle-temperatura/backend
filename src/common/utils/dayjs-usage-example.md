# Global Dayjs Configuration Usage

The dayjs library is now configured globally for the entire application with:
- **Timezone**: `America/Sao_Paulo`
- **Locale**: `pt-br`
- **Plugins**: UTC and Timezone support

## How to Use in Any Service

Simply import the configured dayjs instance:

```typescript
import dayjs from '../../common/utils/dayjs.config';

// All dates will automatically use America/Sao_Paulo timezone
const now = dayjs(); // Current time in São Paulo timezone
const specificDate = dayjs('2024-01-15'); // Parsed in São Paulo timezone
const startOfDay = dayjs().startOf('day'); // Start of day in São Paulo timezone
```

## Examples

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import dayjs from '../../common/utils/dayjs.config';

@Injectable()
export class MyService {
  getCurrentTimestamp() {
    return dayjs().toDate(); // Returns Date in São Paulo timezone
  }

  formatDate(date: Date) {
    return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
  }

  isToday(date: Date) {
    return dayjs(date).isSame(dayjs(), 'day');
  }
}
```

### Common Operations

```typescript
// Get current date/time
const now = dayjs();

// Parse dates (automatically in São Paulo timezone)
const date = dayjs('2024-01-15');

// Format dates
const formatted = dayjs().format('DD/MM/YYYY HH:mm:ss');

// Start/End of periods
const startOfDay = dayjs().startOf('day');
const endOfDay = dayjs().endOf('day');
const startOfMonth = dayjs().startOf('month');
const endOfMonth = dayjs().endOf('month');

// Manipulate dates
const tomorrow = dayjs().add(1, 'day');
const lastWeek = dayjs().subtract(7, 'days');

// Convert to JavaScript Date
const jsDate = dayjs().toDate();

// Compare dates
const isAfter = dayjs('2024-01-15').isAfter('2024-01-01');
const isBefore = dayjs('2024-01-01').isBefore('2024-01-15');
const isSame = dayjs('2024-01-15').isSame('2024-01-15');
```

## Important Notes

1. **No need to configure dayjs again** - It's already configured globally
2. **All dates respect São Paulo timezone** - No manual timezone conversion needed
3. **Locale is pt-br** - Day/month names will be in Portuguese
4. **UTC plugin enabled** - You can use `.utc()` if needed for specific cases



