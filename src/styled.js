import styled from 'styled-components'

const Flex = styled.div`
display: flex;
flex-direction: ${props => props.column ? 'column' : 'row'};
justify-content: ${props => props.justify || 'flex-start'};
align-items: ${props => props.align || 'center'};
flex-wrap: ${props => props.flexWrap}
`

export { Flex };
