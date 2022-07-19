import abi from './utils/BuyMeACoffe.json';
import { ethers, utils } from "ethers";
import React, { useEffect, useState } from "react";
import styles from './styles/Home.module.css'
import monster from './utils/monster.jpg';

export default function Home() {
  const contractAddress = "0xDBa03676a2fBb6711CB652beF5B7416A53c1421D";
  const contractABI = abi.abi;

  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: 'eth_accounts' })
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("carteira conectada! " + account);
      } else {
        console.log("verificar se a carteira está conectada");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("por favor, instale o metamask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("comprando monster..")
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          { value: ethers.utils.parseEther("0.001") }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("Monster comprado!");

        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask não está conectada");
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);

  return (
    <div className={styles.container}>

      <title>Monster Energy</title>
      <meta name="description" content="Tipping site" />
      <link rel="icon" href="/favicon.ico" />

      <main className={styles.main}>
        <img with="300px" height="400px" src={monster} />
        <h1 className={styles.title}>
          Compra um monster pra mim!
        </h1>

        {currentAccount ? (
          <div>
            <form>
              <div class="formgroup">
                <label>
                  Nome
                </label>
                <br />

                <input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome"
                  onChange={onNameChange}
                />
              </div>
              <br />
              <div class="formgroup">
                <label>
                  Me manda uma mensagem
                </label>
                <br />

                <textarea
                  rows={3}
                  placeholder="Mensagem"
                  id="message"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={buyCoffee}
                >
                  1 Monster Energy por 0.001ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet} style={{ padding: "10px" }}> Conecte sua carteira </button>
        )}
      </main>

      {currentAccount && (<h1>Mensagens recebidas</h1>)}

      {currentAccount && (memos.map((memo, idx) => {
        return (
          <div key={idx} style={{ border: "2px solid", "border-radius": "5px", padding: "5px", margin: "5px" }}>
            <p style={{ "font-weight": "bold" }}>"{memo.message}"</p>
            <p>From: {memo.name} at {memo.timestamp.toString()}</p>
          </div>
        )
      }))}
    </div>
  )
}