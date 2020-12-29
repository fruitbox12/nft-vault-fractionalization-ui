import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { txLink } from 'utils/etherscan'
import { connect } from 'react-redux'

const Wrapper = styled.div`
  position: fixed;
  z-index: -101;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  opacity: 0;
  background: transparent;
  transition: all 0.2s;

  &.show {
    z-index: 101;
    opacity: 1;
    background: var(--color-opacity09);
  }
`

const Content = styled.div`
  max-width: 608px;
  background-color: var(--color-white);
  box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.5), 6px 2px 4px 0 rgba(0, 0, 0, 0.5);
  padding: 30px 80px;

  h1 {
    margin-top: 24px;
    margin-bottom: 0;
    font-size: 24px;
    line-height: 36px;
    color: var(--color-yellow);
  }

  > img {
    width: 240px;
    margin-bottom: 24px;
  }

  h4 {
    font-size: 12px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    align-items: center;
    h2 {
      margin: 0 10px;
    }
    > img {
      width: 32px;
    }
  }
`
const DEFAULT_IMAGE_URL = '/assets/default-asset-img.jpg';

function AssetModal({ category, asset, show, onHide }) {
  return ReactDOM.createPortal(
    (<Wrapper className={`flex-all ${show ? 'show' : 'hide'}`} onMouseDown={() => onHide && onHide()}>
      <Content className="center flex-center flex-column justify-center">
        <img src={asset.image_url || DEFAULT_IMAGE_URL} />
        <div>
          <h3 className="light">{asset.name}</h3>
          {(asset.asset_contract && asset.asset_contract.name) && (
            <h4 className="light">by {asset.asset_contract.name}</h4>
          )}
          <div className="pagination">
            <img src="/assets/arrow-left-darker.svg"/>
            <h2>12/35</h2>
            <img src="/assets/arrow-right-darker.svg"/>
          </div>
        </div>
      </Content>
    </Wrapper>),
    document.body
  )
}

export default AssetModal