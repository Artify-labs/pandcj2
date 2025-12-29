import { createSlice } from '@reduxjs/toolkit'

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: [], // array of product objects
    },
    reducers: {
        addToWishlist: (state, action) => {
            const product = action.payload
            const exists = state.items.find(i => i.id === product.id)
            if (!exists) state.items.push(product)
        },
        removeFromWishlist: (state, action) => {
            const productId = action.payload
            state.items = state.items.filter(i => i.id !== productId)
        },
        clearWishlist: (state) => {
            state.items = []
        }
    }
})

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions

export default wishlistSlice.reducer
