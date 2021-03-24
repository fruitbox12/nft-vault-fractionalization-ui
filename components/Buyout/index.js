import { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import qs from 'qs'
import Button from 'components/common/Button'
import AssetList from 'components/Markets/AssetList'
import B20Spinner from 'components/common/B20Spinner'
import { getAssets } from 'utils/api'
import { format } from 'utils/number'
import { addressLink, openseaLink, networks, connectNetworks, txLink } from 'utils/etherscan'
import { getDuration, useTicker } from 'utils/hooks'
import { shorten } from 'utils/string'
import BidModal from 'components/Buyout/BidModal'
import SpinnerModal from 'components/common/SpinnerModal'

const STATUS = Object.freeze({
  STATUS_ACTIVE: 1,
  STATUS_REVOKED: 2,
  STATUS_ENDED: 3,
})

const Wrapper = styled.div`
  flex: 1;
  overflow: auto;

  background: var(--color-white);
  padding: 24px 35px 20px;
  width: 1216px;
  max-width: 100%;
  border: 1px solid #979797;
  position: relative;
  .home-header {
    position: relative;
    margin-bottom: 20px;
    .header-title {
      padding-bottom: 8px;
    }
  }
  .home-body {
    .body-title {
      margin-bottom: 8px;
    }
    .body-right {
      width: calc(100% - 360px);
    }
    .body-left {
      width: 310px;
    }
    .desc {
      padding-bottom: 24px;
      margin-bottom: 10px;
    }
    .subscriptions {
      padding: 20px;
      box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.14);
      background-color: #fbfbfb;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-bottom: 24px;
      > div {
        margin-bottom: 20px;
        &:last-of-type {
          margin-bottom: 0;
        }
      }
      p {
        font-size: 12px;
        margin-bottom: 5px;
      }
    }
    .balance {
      padding: 20px;
      box-shadow: 0 2px 15px 0 rgba(0, 0, 0, 0.14);
      background-color: #f2f2f2;
      border: 1px solid #e2e2e2;
      border-radius: 4px;
      margin-bottom: 24px;
      > div {
        margin-bottom: 16px;
        &:last-of-type {
          margin-bottom: 0;
        }
      }
      p {
        font-size: 12px;
      }
      .balance-desc {
        font-size: 15px;
        line-height: 18px;
      }
      .asset-balance {
        font-size: 18px;
        line-height: 21px;
      }
    }

    .asset-icon {
      border-radius: 50%;
      width: 24px;
      height: 24px;
      margin-right: 6px;
      vertical-align: bottom;
    }

    @media (max-width: 991px) {
      .body-content {
        flex-direction: column;
      }
      .body-right,
      .body-left {
        width: 100%;
        margin-bottom: 40px;
      }
    }
  }
  .border-bottom {
    border-bottom: 1px solid var(--color-border);
  }
  @media (max-width: 767px) {
    padding: 50px 20px 20px;
  }
`

const MIN_ALLOWANCE = 10 ** 10

export default connect((state) => state)(function Home({ metamask, library, eventTimestamp }) {
  const [now] = useTicker()
  const [assets, setAssets] = useState([])
  const [data, setData] = useState(null)
  const [showBidModal, setShowBidModal] = useState(false)
  const [showVetoModal, setShowVetoModal] = useState(false)
  const [pendingTx, setPendingTx] = useState('')

  const handleBid = (total, token2) => {
    if (library?.methods?.Buyout?.placeBid && total && token2) {
      library.methods.Buyout.placeBid(
        library.web3.utils.toWei(total.toString()),
        library.web3.utils.toWei(token2.toString()),
        {
          from: metamask.address,
        }
      )
        .send()
        .on('transactionHash', function (hash) {
          setPendingTx(hash)
          setShowBidModal(false)
        })
        .on('receipt', function (receipt) {
          setPendingTx('')
        })
        .on('error', (err) => {
          setPendingTx('')
        })
    }
  }

  const handleVetoWithdraw = () => {

  }

  const handleVetoExtend = () => {

  }

  const handleVetoAdd = () => {

  }

  const handleApproveToken0 = (amount) => {
    const { approve } = library.methods.Token0
    const allowAmount = Math.max(amount, MIN_ALLOWANCE)
    approve(library.addresses.BuyOut, library.web3.utils.toWei(allowAmount.toString()), {
      from: metamask.address,
    })
      .send()
      .on('transactionHash', function (hash) {
        setPendingTx(hash)
      })
      .on('receipt', function (receipt) {
        setPendingTx('')
        data['allowance'][0] = allowAmount
        setData({ ...data })
      })
      .on('error', (err) => {
        setPurchaseTx('')
        console.log(err)
      })
  }

  const handleApproveToken2 = (amount) => {
    const { approve } = library.methods.Token2
    const allowAmount = Math.max(amount, MIN_ALLOWANCE)
    approve(library.addresses.BuyOut, library.web3.utils.toWei(allowAmount.toString()), {
      from: metamask.address,
    })
      .send()
      .on('transactionHash', function (hash) {
        setPendingTx(hash)
      })
      .on('receipt', function (receipt) {
        setPendingTx('')
        data['allowance'][1] = allowAmount
        setData({ ...data })
      })
      .on('error', (err) => {
        setPurchaseTx('')
        console.log(err)
      })
  }

  const getRequiredToken0ToBid = useCallback(async (total, token2) => {
    let result = 0
    if (library?.methods?.Buyout?.requiredToken0ToBid && total && token2) {
      try {
        result = await library.methods.Buyout.requiredToken0ToBid(
          library.web3.utils.toWei(total.toString()),
          library.web3.utils.toWei(token2.toString())
        )
        result = Number(library.web3.utils.fromWei(result)).toFixed(2)
      } catch (err) {
        console.log(err)
      }
    }
    return result;
  }, [library?.methods?.Buyout?.requiredToken0ToBid]);

  const loading = !data
  const loadData = (first) => {
    const { totalAssets } = library.methods.Vault
    const { symbol: symbol0, balanceOf: balance0, getAllowance: allowance0 } = library.methods.Token0
    const { symbol: symbol2, balanceOf: balance2, getAllowance: allowance2 } = library.methods.Token2
    const {
      EPOCH_PERIOD,
      HEART_BEAT_START_TIME,
      epochs,
      status,
      startThreshold,
      highestBidder,
      highestBidValues,
      currentBidId,
      token0Staked,
      lastVetoedBidId,
    } = library.methods.Buyout
    const { getBlock } = library.methods.web3

    Promise.all([
      totalAssets(),
      getBlock(),
      // contributors(),
      first
        ? Promise.all([
            EPOCH_PERIOD(),
            HEART_BEAT_START_TIME(),
            epochs(1),
            status(),
            startThreshold(),
            symbol0(),
            symbol2(),
          ])
        : Promise.resolve([]),
      Promise.all([
        balance0(metamask.address),
        balance2(metamask.address),
        allowance0(metamask.address, library.addresses.BuyOut),
        allowance2(metamask.address, library.addresses.BuyOut),
        highestBidder(),
        highestBidValues(0),
        currentBidId(),
        token0Staked(metamask.address),
        lastVetoedBidId(metamask.address),
      ]),
    ])
      .then(
        ([
          totalAssets,
          lastTimestamp,
          // contributors,
          buyoutInfo,
          [balance0, balance2, allowance0, allowance2, bidder, bidValue, currentBidId, token0Staked, lastVetoedBidId],
        ]) => {
          const newData = {
            totalAssets,
            lastTimestamp: new Date(lastTimestamp * 1000),
            timestamp: Date.now(),
            bidder,
            bidValue,
            balance: [library.web3.utils.fromWei(balance0), library.web3.utils.fromWei(balance2)],
            allowance: [library.web3.utils.fromWei(allowance0), library.web3.utils.fromWei(allowance2)],
            currentBidId,
            token0Staked,
            lastVetoedBidId,
          }
          if (first) {
            const [EPOCH_PERIOD, HEART_BEAT_START_TIME, epochs, status, startThreshold, symbol0, symbol2] = buyoutInfo
            newData.buyoutInfo = {
              EPOCH_PERIOD,
              HEART_BEAT_START_TIME,
              endTime: (+HEART_BEAT_START_TIME + EPOCH_PERIOD * epochs) * 1000,
              epochs: Number(epochs),
              status: Number(status),
              startThreshold: library.web3.utils.fromWei(startThreshold),
              symbol: [symbol0, symbol2],
            }
          }
          setData(newData)
        }
      )
      .catch(console.log)
  }
  useEffect(() => {
    if (library && !data && metamask.address) {
      loadData(true)
    }
  }, [library, data, metamask])
  useEffect(() => {
    if (eventTimestamp && data && eventTimestamp > data.timestamp) {
      loadData()
    }
  }, [eventTimestamp, data])

  useEffect(() => {
    if (data?.totalAssets && Number(data.totalAssets) > 0) {
      const queryAssets = async function () {
        try {
          const tokenAssets = await library.methods.Vault.assets(0, data.totalAssets)
          const result = await getAssets(
            {
              token_ids: tokenAssets.map(({ tokenId }) => tokenId),
              asset_contract_addresses: tokenAssets.map(({ tokenAddress }) => tokenAddress),
              limit: 50,
              offset: 0,
            },
            {
              paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
              },
            }
          )
          if (result?.data?.assets) {
            const assets = result.data.assets.map((asset) => {
              const matching = tokenAssets.find((e) => e.tokenId === asset.token_id)
              asset.category = matching ? matching.category : 'Other'
              return asset
            })
            setAssets(assets)
          }
        } catch (err) {
          console.log(err)
        }
      }
      queryAssets()
    }
  }, [data?.totalAssets])

  const validNetwork = library && networks.includes(library.wallet.network)
  if (!validNetwork)
    return (
      <Wrapper className="bg-opacity-07 flex-all">
        <h3>{connectNetworks()}</h3>
      </Wrapper>
    )

  return (
    <Wrapper>
      <div className="home-header">
        <div className="header-title border-bottom">
          <h1 className="col-pink">THE BIG B.20 BUYOUT</h1>
        </div>
      </div>
      <div className="home-body">
        <div className="body-content flex justify-between">
          <div className="body-right">
            <div className="body-title">
              <h4 className="uppercase">B20 Buyout</h4>
            </div>
            <div className="desc">
              Welcome to the Big B.20 Buyout. With a minimum bid of $10 mn (tentative estimate), you can begin the
              buyout process. for the entire bundle.
              <br />
              <br />
              Your bid will stand for 48 epochs (each epoch is 8 hours), during which time someone else can outbid you,
              or the community can veto the bid with a 25% consensus. If the community veto is successful, the minimum
              bid increases by 8%.
              <br />
              <br />
              Good luck!
            </div>
            <div className="item-list">
              <AssetList assets={assets} loading={!assets.length} />
            </div>
          </div>
          <div className="body-left">
            <div className="subscriptions">
              <div>
                <p>Buyout Clock</p>
                {data ? (
                  data.buyoutInfo.status === STATUS.STATUS_ACTIVE ? (
                    <h2 className="col-green light">Ends in {getDuration(now, data.buyoutInfo.endTime)}</h2>
                  ) : data.buyoutInfo.status === STATUS.STATUS_ENDED ? (
                    <h2 className="col-red light">Buyout has ended</h2>
                  ) : (
                    <h2 className="light">Awaiting minimum bid of {data.buyoutInfo.startThreshold} DAI</h2>
                  )
                ) : (
                  <h2 className="light">...</h2>
                )}
              </div>
              <div>
                <p>Highest bid:</p>
                <h2 className="light" style={{ fontSize: '125%' }}>
                  {data && [STATUS.STATUS_ACTIVE, STATUS.STATUS_ENDED].includes(data.buyoutInfo.status) ? (
                    <>
                      <img className="asset-icon" src="/assets/dai.svg" alt="DAI" />
                      {data.bidValue} DAI by{' '}
                      <a href={addressLink(data.bidder)} target="_blank">
                        {shorten(data.bidder)}
                      </a>
                    </>
                  ) : (
                    '---'
                  )}
                </h2>
              </div>
            </div>
            <div className="balance">
              <div>
                <h4 className="light balance-desc">
                  To place a bid, you need DAI and 5% of all B20.
                  <br />
                  To veto a bid, you just need B20.
                </h4>
              </div>
              <div>
                <h3 className="col-blue">You currently have</h3>
              </div>
              <div>
                <h3 className="light asset-balance">
                  <img className="asset-icon" src="/assets/dai.svg" alt="DAI" /> {data && data.balance[1]} DAI
                </h3>
              </div>
              <div>
                <h3 className="light asset-balance">
                  <img className="asset-icon" src="/assets/b20.svg" alt="B20" /> {data && data.balance[0]} B20
                </h3>
              </div>
            </div>
            <Button className="full-width grey" onClick={() => setShowBidModal(true)}>Bid</Button>
            <h3 className="center light">or</h3>
            <Button className="full-width" onClick={() => setShowVetoModal(true)}>Veto</Button>
          </div>
        </div>
      </div>
      <BidModal
        minTotal={data?.buyoutInfo?.startThreshold}
        b20Balance={data?.balance[0]}
        b20Allowance={data?.allowance[0]}
        daiBalance={data?.balance[1]}
        daiAllowance={data?.allowance[1]}
        getRequiredB20={getRequiredToken0ToBid}
        show={showBidModal}
        onHide={() => setShowBidModal(false)}
        onContinue={handleBid}
        onApproveB20={handleApproveToken0}
        onApproveDai={handleApproveToken2}
      />
      <SpinnerModal show={!!pendingTx}>
        <h3 className="col-white">
          <br />
          <br />
          Transaction hash:
          <br />
          <a className="col-white light" href={txLink(pendingTx, library.wallet.network)} target="_blank">
            {shorten(pendingTx, 32)}
          </a>
        </h3>
      </SpinnerModal>
    </Wrapper>
  )
})
