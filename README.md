# Forex MCP

This project is a local-first Model Context Protocol (MCP) server that provides structured access to
Forex market data, technical indicators, trading session metadata, and backtesting primitives for AI
agents and developer tools.

It is designed for deterministic quantitative research, automation, and AI-assisted trading
workflows—without relying on cloud APIs or vendor-locked platforms.

## Prerequisites

- Node.js 25+
- A local LLM or API based LLM
- An interface to run LLMs
- Historical Forex data

### An Interface

You will need a local interface in which to interact with your LLM that runs on a Linux system. This
can be done through Ollama directly or even a commercial platform as long as there is a Linux
version to use. Below is a non-exhaustive list of some common ones.

<!-- markdownlint-disable MD060 -->
| Provider        | Official | Installation                                                 |
| --------------- | -------- | ------------------------------------------------------------ |
| AnythingLLM     | Yes      | [anythingllm.com](https://anythingllm.com/)                      |
| ChatGPT Desktop | No       | [github.com/lencx/ChatGPT](https://github.com/lencx/ChatGPT) |
| Claude Desktop  | No       | [github.com/aaddrick/claude-desktop-debian](https://github.com/aaddrick/claude-desktop-debian) |
| Gemini CLI      | Yes      | [geminicli.com](https://geminicli.com/)                      |
| LM Studio       | Yes      | [lmstudio.ai](https://lmstudio.ai/)                          |
| Open WebUI      | Yes      | [docs.openwebui.com](https://docs.openwebui.com/)            |
| VSCode Copilot  | Yes      | [code.visualstudio.com](https://code.visualstudio.com/)      |
<!-- markdownlint-enable MD060 -->

If you need an out of the box solution for running an LLM locally on Linux, simply use Docker
compose to install Ollama and/or Open WebUI. This will install these applications on ports `11434`
and `8080` respectively.

The compose files do not assume you will use Ollama and Open WebUI together. You can if desired
of course. Therefore, you'll need to set up Ollama in your Web Ui configuration if using it by
following [this guide](https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-ollama).

_Note: The Open WebUI container is set to use host networking and a Linux machine is assumed, so the
URL `http://host.docker.internal:11434` as mentioned in the guide should be `http://localhost:11434`
instead._

```bash
# start all services in detached mode
docker compose up -d

# to start services individually
docker compose -f containers/compose.ollama.yml up -d
docker compose -f containers/compose.webui.yml up -d

# install preferred models for Ollama, if installed
# see: https://ollama.com/library
docker exec -it ollama ollama pull nomic-embed-text
docker exec -it ollama ollama pull llama3.2:1b

# stop and remove individual containers
docker compose -f containers/compose.ollama.yml down -v
docker compose -f containers/compose.webui.yml down -v

# follow logs if needed
docker compose logs -f ollama
docker compose logs -f open-webui

# quick connectivity test
nc -vz <ip> <port>

# stop and remove all containers and volumes
docker compose down -v

# reset system to a blank state after compose down
docker system prune -a --volumes
```

### Historical Data

There will be very limited functionally if you do not possess Forex OHLCV data for the Forex spot
market. For the sake of demonstration, you can download and install data for `EUR/USD` by running
the `scripts/demo.mjs` script file.

Be aware that OHLCV and tick data are extremely broker specific in an Over-the-Counter (OTC) market
such as spot Forex. Spreads vary from broker to broker and even OHLCV is typically based on a
broker's bid or midpoint price and broker's volume. There is no global market data in spot Forex.

Future versions of the MCP server may use tick data and broker specific data to catpure past spreads
for a specific broker rather than assume it's for the market as a whole. Be aware that past spreads
are no indication of future spreads however.

So the first version uses OHLCV data with the understanding you will mathematically adjust
in realtime spreads based on a broker's published documentation and current market volatility.

## Installation

Forex MCP Server is designed to run alongside a local LLM runtime. Any MCP-compatible client or AI
tool can connect, but a local LLM is recommended for deterministic, offline workflows. Once you have
that installed the rest is straightforward as what would be with any Node application.

As with any Node.js application the first thing to do is to install dependencies.

```bash
# for production
npm ci --omit=dev

# for development
npm i
```

After that, you'll need CSV data in the `data` directory to create your DuckDB database with. The
CSV data should not have column titles and be formmated as such:

```text
2010.01.03,22:00,1.430100,1.430400,1.430100,1.430400,0
```

The columns are `date`, `time`, `open`, `high`, `low`, `close`, and `volume`. But do not include the
title in the CSV file. The files should be named in the format `[pair]_[timeframe]_[year].csv`.

```text
eurusd_m1_2010.csv
eurusd_m1_2011.csv
eurusd_m1_2012.csv
```

For production you should get the `DB_PATH` environment variable to where you want the database file
to be created. For development, you should set the path in a dotenv file using a variable of the
same name.

Lastly, run the script `scripts/data.mjs` to create the datbase. Once this is done then you're
ready to run the application.

## Usage

This will vary depending on the interface selected. You best bet is finding the relevant
documentation for the client you selected or just ask the LLM how to reference a local MCP server.
Once you do the LLM will become aweare of the Forex data presented.

By default the MCP port will be on `3,000` unless overridden by the MCP_PORT environment variable.

Here are instructions for pointing Open WebUI to an MCP server for instance:
[Open WebUI MCP Setup](https://docs.openwebui.com/features/extensibility/mcp).

_Note: The Open WebUI container is set to use host networking and a Linux machine is assumed, so the
URL `http://host.docker.internal:<port>` as mentioned in the guide should be
`http://localhost:<port>` instead._

### Inspector

In conjunction to using a full-blown interface, it is recommended to also leverage the built-in
inspector for development mode. This will allow you inspect MCP interactions such as prompts,
resources, and tools.

It can be ran via:

```bash
npm run inspect
```

Remember to use this only during in development as the inspector may expose internal state and
increase resource usage.

## Todos

- Equity curve
- Limit orders
- Max drawdown
- Monte Carlo runs
- Partial fills
- Slippage models
- Tick simulation
- Trade list
- Variable spreads
- Multi-timeframe calculations
- Streaming support
- Walk-forward optimization
