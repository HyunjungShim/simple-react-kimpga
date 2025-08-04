import { ClearButton, CustomInput, FlexBox } from "../../assets/styles/common/CommonStyle";

type SearchInputProps = {
    searchInput: string,
    setSearchInput: (value: string) => void 
}

export default function SearchInput({ searchInput, setSearchInput }: SearchInputProps) {
    return (
        <FlexBox style={{position: 'relative'}}>
            <CustomInput placeholder="코인 검색" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            {searchInput.trim() !== '' && <ClearButton onClick={() => setSearchInput('')}>🗙</ClearButton>}
        </FlexBox>
    )
}