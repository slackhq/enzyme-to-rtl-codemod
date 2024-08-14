import React from 'react';

describe('Test suite', () => {
    it('renders the component', () => {
        // convert mount var
        const component = renderComponent();

        // convert find
        const dashboardCards = component.find('selector');

        // convert simulate
        dashboardCards.simulate('click');

        // update
        component.update();

        // hostNodes
        component.find('div').hostNodes().toHaveLength(1);
    });
});
