import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Component from '..';

describe('Test suite', () => {
    it('renders the component', () => {
        // convert mount var
        const component = renderComponent();

        // convert find 1
        component.find('[data-id="element"]')        

        // convert find 2 Component
        component.find('Component');

        component.contains('string')

        // convert setState
        component.setState('selector');

        // convert prop
        component.prop('selector');

        // convert state()
        component.state();
    });

    function renderComponent(props = {}): ReactWrapper {
        // convert mount method
        return mount(<Component {...props} />);
    }
});
