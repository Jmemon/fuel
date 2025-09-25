# Fuel UI/UX Design Improvement TODOs

This document outlines design and user experience improvements needed for the Fuel activity logging application.

## Manual Log Creation Form UX Issues

### Current Issues
- Basic textarea with minimal styling
- No character counter (with 10,000 character limit)
- No preview functionality
- Limited formatting options
- No auto-save or draft functionality
- No rich text editing capabilities
- Form validation feedback could be more prominent

### Suggested Improvements

#### 1. Enhanced Text Input
- [ ] **Add character counter**: Display current count vs. 10,000 limit with color coding
- [ ] **Auto-resize textarea**: Expand height as user types, with reasonable max-height
- [ ] **Rich text editor**: Consider adding markdown support or basic formatting (bold, italic, lists)
- [ ] **Syntax highlighting**: If users log code snippets, add basic syntax highlighting
- [ ] **Auto-save drafts**: Save content to localStorage every few seconds to prevent data loss

#### 2. Form Validation & Feedback
- [ ] **Real-time validation**: Show character count warnings as user approaches limit
- [ ] **Better error display**: Use inline validation messages instead of alert boxes
- [ ] **Success feedback**: Show confirmation message with animation when log is created
- [ ] **Loading states**: Better visual feedback during submission

#### 3. Enhanced Functionality
- [ ] **Preview mode**: Toggle between edit and preview (especially useful if markdown is added)
- [ ] **Templates**: Pre-defined templates for common log types (meeting notes, bug reports, etc.)
- [ ] **Tags/Categories**: Optional tagging system for better organization
- [ ] **Quick actions**: Keyboard shortcuts (Ctrl+S to save, Ctrl+Enter to submit)

#### 4. Accessibility Improvements
- [ ] **Keyboard navigation**: Ensure all form elements are keyboard accessible
- [ ] **ARIA labels**: Add proper accessibility labels
- [ ] **Focus management**: Better focus indicators and management
- [ ] **Screen reader support**: Ensure form instructions are read properly

## Log Entry Design Issues

### Current Issues
- Basic card design with minimal visual hierarchy
- Timestamp formatting could be more readable
- Content display lacks rich formatting
- No visual distinction between different log types beyond small badges
- Delete action is prominent but could be less destructive-looking
- No preview/expand functionality for long content
- Limited interaction capabilities

### Suggested Visual Design Improvements

#### 1. Card Design Enhancement
- [ ] **Visual hierarchy**: Better spacing, typography, and layout structure
- [ ] **Type-specific styling**: Different border colors, icons, or backgrounds for different log types
- [ ] **Improved badges**: More visually appealing type indicators with icons
- [ ] **Status indicators**: More prominent "New/Unreviewed" badges with animations
- [ ] **Depth and shadows**: Add subtle shadows or elevation for better card separation

#### 2. Content Presentation
- [ ] **Rich content rendering**: Support markdown rendering for formatted text
- [ ] **Expandable content**: Show truncated content with "Read more" for long entries
- [ ] **Code block formatting**: Proper formatting for code snippets with syntax highlighting
- [ ] **Link detection**: Auto-detect and make URLs clickable
- [ ] **Line break preservation**: Better handling of multi-line content

#### 3. Timestamp & Metadata
- [ ] **Relative timestamps**: Show "2 hours ago" instead of full timestamp, with hover for exact time
- [ ] **Time grouping**: Group logs by day with date headers
- [ ] **Duration tracking**: For applicable log types, show duration or time spans
- [ ] **Timezone handling**: Display timestamps in user's local timezone

#### 4. Interactive Elements
- [ ] **Hover states**: Subtle hover effects for better interactivity feedback
- [ ] **Action menu**: Replace single delete button with dropdown menu (Edit, Copy, Archive, Delete)
- [ ] **Quick actions**: Inline buttons for common actions (Mark as important, Add follow-up, etc.)
- [ ] **Drag and drop**: Possibly for reordering or grouping logs

#### 5. Type-Specific Enhancements
- [ ] **Git Commit logs**: Show file changes, diff previews, commit graph visualization
- [ ] **Claude Code logs**: Show conversation summaries, tool usage stats, token counts with progress bars
- [ ] **Git Checkout logs**: Visual branch representation, before/after states
- [ ] **Manual logs**: Enhanced formatting options, attachment support

### Content Layout Improvements

#### 1. Grid vs List View
- [ ] **Multiple view options**: List view (current) and compact grid view
- [ ] **Density controls**: Allow users to choose compact, normal, or spacious density
- [ ] **Column customization**: For power users, customizable columns in table view

#### 2. Filtering & Search UX
- [ ] **Advanced filters**: More intuitive filter interface with chip-based selections
- [ ] **Search functionality**: Full-text search across log content
- [ ] **Saved filters**: Allow users to save and name common filter combinations
- [ ] **Filter breadcrumbs**: Show active filters as removable chips

#### 3. Bulk Operations
- [ ] **Multi-select**: Checkbox selection for bulk operations
- [ ] **Bulk actions**: Mark multiple as reviewed, delete multiple, export selection
- [ ] **Select all/none**: Easy selection controls

## Overall Application Design

### Navigation & Layout
- [ ] **Responsive design**: Better mobile/tablet layouts
- [ ] **Sidebar improvements**: Collapsible sidebar, better visual hierarchy
- [ ] **Breadcrumb navigation**: Show current location and allow easy navigation
- [ ] **Keyboard shortcuts**: Global shortcuts for common actions

### Color Scheme & Theming
- [ ] **Dark mode support**: Toggle between light and dark themes
- [ ] **Improved color palette**: More cohesive and accessible color scheme
- [ ] **Brand identity**: Develop consistent visual identity for Fuel
- [ ] **Customization**: Allow users to customize accent colors

### Performance & Loading
- [ ] **Skeleton screens**: Show content placeholders while loading
- [ ] **Infinite scroll**: For large log collections, implement infinite scroll with virtualization
- [ ] **Progressive loading**: Load critical content first, then enhance
- [ ] **Optimistic updates**: Show changes immediately, sync in background

### Data Visualization
- [ ] **Activity timeline**: Visual timeline view of all activities
- [ ] **Statistics dashboard**: Charts showing activity patterns, types distribution
- [ ] **Productivity insights**: Trends, most active times, productivity metrics
- [ ] **Heatmaps**: Calendar-style activity heatmaps

## Technical Implementation Priorities

### High Priority (Core UX Issues)
1. Enhanced manual log form with character counter and auto-resize
2. Improved log entry cards with better visual hierarchy
3. Relative timestamps and better date formatting
4. Rich text rendering (markdown support)
5. Better loading states and error handling

### Medium Priority (Nice to Have)
1. Dark mode support
2. Advanced filtering interface
3. Bulk operations
4. Type-specific log enhancements
5. Search functionality

### Low Priority (Future Enhancements)
1. Data visualization dashboards
2. Advanced theming options
3. Drag and drop functionality
4. Multi-view options (grid/list)
5. Productivity analytics

## Design System Considerations

- [ ] **Component library**: Establish reusable component patterns
- [ ] **Design tokens**: Define colors, spacing, typography as design tokens
- [ ] **Responsive breakpoints**: Standardize breakpoints across components
- [ ] **Animation library**: Consistent animations and transitions
- [ ] **Icon system**: Consistent icon usage throughout the app

## User Testing & Validation

- [ ] **User feedback collection**: In-app feedback mechanism
- [ ] **Usage analytics**: Track user interactions to identify pain points
- [ ] **A/B testing**: Test different design approaches
- [ ] **Accessibility testing**: Ensure compliance with WCAG guidelines
- [ ] **Performance monitoring**: Track and improve loading times and interactions