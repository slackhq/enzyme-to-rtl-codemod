import userEvent from "@testing-library/user-event";
import { render, screen, configure } from "@testing-library/react";
import "@testing-library/jest-dom";

configure({
    testIdAttribute: "data-id"
});

import React from 'react';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });

// Test Suite
describe('Example test suite', () => {
    // Function to mount the component
    const mountComponent = (props = {}) => {
        return render(<DummyComponent {...props} />);
    };

    it('renders the dashboard cards', () => {
        mountComponent();
        // Conversion suggestion: .find('.DashboardCard') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // Find the dashboard card by class
        const dashboardCards = component.find('.DashboardCard');
        expect(dashboardCards.length).toBe(1);

        // Conversion suggestion: .find('.clickMe') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // Simulate a click event on a button
        const button = component.find('.clickMe');
        userEvent.click(button);

        // Conversion suggestion: .find('div') --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')

        // Ensure the div exists and has a length of 1
        expect(component.find('div')).toHaveLength(2);

        // Check if the dashboardCards element exists
        expect(dashboardCards).toBeInTheDocument();
    });
});

const DummyComponent = () => (
    <div>
        <h1>Hello, World!</h1>
        <div className="DashboardCard">Card 1</div>
        <button className="clickMe">Click Me</button>
    </div>
);
