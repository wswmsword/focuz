# 原理

## 形态

Tab Navigation：

```javascript
<Focus>
  <Entry>Open</Entry>

  <List>

    <Exit><Head>Close</Head></Exit>
    <Exit>Cancel<Exit>
    <Tail>OK</Tail>
  </List>
</Focus>
```

Arrow Navigation：

```javascript
<Focus>
  <Entry><button>Open</button></Entry>

  <List>
    <Item><button>1</button></Item>
    <Item><button>2</button></Item>
    <Item><button>3</button></Item>
    <Item><button>4</button></Item>
    <Exit><Item><button>5</button></Item></Exit>
  </List>
</Focus>
```

Nested：

```javascript
<Focus>
  <Entry>Open</Entry>

  <List>
    <Item><a>1</a></Item>
    <Item><a>2</a></Item>
    <Focus>
      <Entry><Item><button>3</button></Item></Entry>
      <List>
        <Head></Head>
        <Tail></Tail>
      </List>
    </Focus>
  </List>
</Focus>
```

Block Nested：

```javascript
<Focus>
  <Entry>Open</Entry>

  <List>
    <Item>
      <Focus>
        <Entry>Open</Entry>
        <List>
          <Head></Head>
          <Tail></Tail>
        </List>
      </Focus>
    </Item>
    <Item>
      <Focus>
        <Entry>Open</Entry>
        <List>
          <Head></Head>
          <Tail></Tail>
        </List>
      </Focus>
    </Item>
    <Item>
      <Focus>
        <Entry>Open</Entry>
        <List>
          <Head></Head>
          <Tail></Tail>
        </List>
      </Focus>
    </Item>
  </List>
</Focus>
```