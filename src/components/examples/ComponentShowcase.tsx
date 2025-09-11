import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Modal,
  Badge,
  DiffStatsBadge,
  LoadingSpinner,
  EmptyState,
  NoFilesEmptyState,
  ToastProvider,
  useToastHelpers,
  PageLayout,
  Navigation,
  ErrorBoundary,
} from '../index';

// Example component to showcase all UI components
const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToastHelpers();

  const handleShowToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred while processing your request.',
      warning: 'Please check your input and try again.',
      info: 'This is an informational message.',
    };

    toast[type]('Toast Notification', messages[type]);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Loading completed!');
    }, 2000);
  };

  const navigationItems = [
    { label: 'Components', active: true },
    { label: 'Examples', active: false },
    { label: 'Documentation', active: false },
  ];

  const headerActions = (
    <div className="flex space-x-2">
      <Button variant="secondary" size="sm">
        Settings
      </Button>
      <Button variant="primary" size="sm">
        New Project
      </Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        <PageLayout
          header={{
            title: 'Component Showcase',
            subtitle: 'Demo of all BDiff UI components',
            navigation: <Navigation items={navigationItems} />,
            actions: headerActions,
          }}
          maxWidth="2xl"
        >
          <div className="space-y-8">
            {/* Buttons Section */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Various button styles and states for different actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Primary</h4>
                    <Button variant="primary" className="w-full">
                      Primary
                    </Button>
                    <Button variant="primary" size="sm" className="w-full">
                      Small
                    </Button>
                    <Button variant="primary" size="lg" className="w-full">
                      Large
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Secondary</h4>
                    <Button variant="secondary" className="w-full">
                      Secondary
                    </Button>
                    <Button variant="secondary" disabled className="w-full">
                      Disabled
                    </Button>
                    <Button variant="secondary" loading className="w-full">
                      Loading
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Ghost</h4>
                    <Button variant="ghost" className="w-full">
                      Ghost
                    </Button>
                    <Button 
                      variant="ghost" 
                      leftIcon={<span>⚙️</span>}
                      className="w-full"
                    >
                      With Icon
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Destructive</h4>
                    <Button variant="destructive" className="w-full">
                      Delete
                    </Button>
                    <Button variant="destructive" size="sm" className="w-full">
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
                <CardDescription>
                  Text inputs with various states and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Basic Input"
                      placeholder="Enter some text..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    
                    <Input
                      label="Input with Icon"
                      placeholder="Search..."
                      leftIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                    
                    <Input
                      label="Input with Error"
                      placeholder="Invalid input"
                      error="This field is required"
                      value="invalid"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      label="Input with Hint"
                      placeholder="Your email address"
                      hint="We'll never share your email"
                      type="email"
                    />
                    
                    <Input
                      label="Disabled Input"
                      placeholder="Cannot edit"
                      disabled
                      value="Disabled value"
                    />
                    
                    <Input
                      label="Password Input"
                      placeholder="Enter password"
                      type="password"
                      rightIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
              <CardHeader>
                <CardTitle>Badges & Status Indicators</CardTitle>
                <CardDescription>
                  Status badges including diff-specific variants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Standard Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="primary">Primary</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="destructive">Error</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Diff Badges</h4>
                    <div className="flex flex-wrap gap-4">
                      <Badge variant="added" count={23} />
                      <Badge variant="removed" count={15} />
                      <Badge variant="modified" count={8} />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Diff Stats</h4>
                    <DiffStatsBadge added={45} removed={22} modified={12} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <CardDescription>
                  Loading spinners and states for different contexts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Sizes</h4>
                    <div className="space-y-4">
                      <div>
                        <LoadingSpinner size="sm" />
                        <p className="text-xs text-gray-500 mt-1">Small</p>
                      </div>
                      <div>
                        <LoadingSpinner size="default" />
                        <p className="text-xs text-gray-500 mt-1">Default</p>
                      </div>
                      <div>
                        <LoadingSpinner size="lg" />
                        <p className="text-xs text-gray-500 mt-1">Large</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3">Colors</h4>
                    <div className="space-y-4">
                      <div>
                        <LoadingSpinner color="primary" />
                        <p className="text-xs text-gray-500 mt-1">Primary</p>
                      </div>
                      <div>
                        <LoadingSpinner color="secondary" />
                        <p className="text-xs text-gray-500 mt-1">Secondary</p>
                      </div>
                      <div className="bg-gray-800 p-2 rounded">
                        <LoadingSpinner color="white" />
                        <p className="text-xs text-gray-300 mt-1">White</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Demo</h4>
                    <Button 
                      onClick={handleLoadingDemo}
                      loading={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Loading...' : 'Start Loading Demo'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Empty States */}
            <Card>
              <CardHeader>
                <CardTitle>Empty States</CardTitle>
                <CardDescription>
                  Empty state variations for different scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium mb-4">No Files</h4>
                    <NoFilesEmptyState 
                      size="sm"
                      onUpload={() => toast.info('Upload triggered')}
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-4">Custom Empty State</h4>
                    <EmptyState
                      size="sm"
                      title="No diffs found"
                      description="The files you selected are identical"
                      action={{
                        label: 'Try Different Files',
                        onClick: () => toast.info('Action triggered'),
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Demos */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Demos</CardTitle>
                <CardDescription>
                  Test modal dialogs and toast notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full"
                  >
                    Open Modal
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => handleShowToast('success')}
                    className="w-full"
                  >
                    Success Toast
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => handleShowToast('error')}
                    className="w-full"
                  >
                    Error Toast
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => handleShowToast('warning')}
                    className="w-full"
                  >
                    Warning Toast
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-600">
                  Click the buttons above to test different interactive components
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* Modal Demo */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            description="This is a demonstration of the modal component"
            size="default"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This modal demonstrates the clean, minimal design principles used throughout 
                the BDiff application. It includes proper accessibility features like 
                keyboard navigation and ARIA labels.
              </p>
              
              <Input
                label="Example Input"
                placeholder="Type something here..."
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setIsModalOpen(false);
                    toast.success('Modal action completed');
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </PageLayout>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default ComponentShowcase;