/* eslint-disable */
import { configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });

import React from 'react';
import { mount } from 'enzyme';

// Dummy Component
const DummyComponent = () => (
    <div>
        <h1>Hello, World!</h1>
        <div className="DashboardCard">Card 1</div>
    </div>
);

// Test Suite
describe('Example test suite', () => {
    // Function to mount the component
    const mountComponent = () => {
        return mount(<DummyComponent />);
    };

    it('renders the dashboard cards', () => {
        const component = mountComponent();
        const dashboardCards = component.find('.DashboardCard');
        expect(dashboardCards.length).toBe(1);
    });
});
