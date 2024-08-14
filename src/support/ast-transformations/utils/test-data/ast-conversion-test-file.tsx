import React from 'react';
import { mount } from 'enzyme';
import Component from '..';

describe('Test suite', () => {
    it('renders the component', () => {
        // convert mount var
        const component = renderComponent();

        // convert find
        const dashboardCards = component.find('selector');

        // update
        component.update();

        // convert simulate
        dashboardCards.simulate('click');

        // hostNodes
        component.find('div').hostNodes().toHaveLength(1);

        // convert exists
        expect(dashboardCards.exists()).toBe(true);
    });

    function renderComponent(props = {}): any {
        // convert mount method
        return mount(<Component {...props} />);
    }
});
