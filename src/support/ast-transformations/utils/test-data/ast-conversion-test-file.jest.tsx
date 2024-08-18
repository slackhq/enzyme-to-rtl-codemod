import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });

// Test Suite
describe('Example test suite', () => {
    // Function to mount the component
    const mountComponent = (props = {}) => {
        return mount(<DummyComponent {...props} />);
    };

    it('renders the dashboard cards', () => {
        const component = mountComponent();
        
        // Find the dashboard card by class
        const dashboardCards = component.find('.DashboardCard');
        expect(dashboardCards.length).toBe(1);

        // Update the component (dummy update for example purposes)
        component.update();

        // Simulate a click event on a button
        const button = component.find('.clickMe');
        button.simulate('click');

        // Ensure the div exists and has a length of 1
        expect(component.find('div').hostNodes()).toHaveLength(2);

        // Check if the dashboardCards element exists
        expect(dashboardCards.exists()).toBe(true);
    });
});

const DummyComponent = () => (
    <div>
        <h1>Hello, World!</h1>
        <div className="DashboardCard">Card 1</div>
        <button className="clickMe">Click Me</button>
    </div>
);
